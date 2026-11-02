import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

async function writeIfChanged(filename, content) {
  try { if (content.equals(await readFile(filename))) return; } catch { /* Primeiro build. */ }
  await writeFile(filename, content);
}

/**
 * Gera os dados de imagem para a entrada ICO.
 * Padrão oficial Win32 Shell / PE:
 * - 256x256 usa PNG compactado (suportado desde o Windows Vista).
 * - Tamanhos menores (16 a 128) utilizam DIB descompactado (BITMAPINFOHEADER 40 bytes,
 *   pixels 32-bit BGRA bottom-up e máscara AND de 1 bit), garantindo que o Windows Explorer,
 *   a Área de Trabalho, atalhos .lnk e o IconCache.db nunca percam o ícone nem exibam
 *   a folha genérica branca após reinicialização do sistema.
 */
async function generateIconImage(source, size) {
  if (size === 256) {
    return sharp(source).resize(256, 256).png().toBuffer();
  }
  const { data: raw, info } = await sharp(source).resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const andRowBytes = Math.floor((w + 31) / 32) * 4;
  const andMask = Buffer.alloc(andRowBytes * h, 0);
  const xorImage = Buffer.alloc(w * h * 4);

  for (let y = 0; y < h; y++) {
    const srcY = h - 1 - y; // bottom-up
    const dstRow = y * w * 4;
    const srcRow = srcY * w * 4;
    for (let x = 0; x < w; x++) {
      const srcIdx = srcRow + x * 4;
      const dstIdx = dstRow + x * 4;
      const r = raw[srcIdx];
      const g = raw[srcIdx + 1];
      const b = raw[srcIdx + 2];
      const a = raw[srcIdx + 3];
      xorImage[dstIdx] = b;
      xorImage[dstIdx + 1] = g;
      xorImage[dstIdx + 2] = r;
      xorImage[dstIdx + 3] = a;
      if (a === 0) {
        const byteIdx = y * andRowBytes + Math.floor(x / 8);
        const bitIdx = 7 - (x % 8);
        andMask[byteIdx] |= (1 << bitIdx);
      }
    }
  }

  const bih = Buffer.alloc(40);
  bih.writeUInt32LE(40, 0); // biSize
  bih.writeInt32LE(w, 4); // biWidth
  bih.writeInt32LE(h * 2, 8); // biHeight * 2 (especificação ICO Windows para XOR + AND)
  bih.writeUInt16LE(1, 12); // biPlanes
  bih.writeUInt16LE(32, 14); // biBitCount
  bih.writeUInt32LE(0, 16); // biCompression = BI_RGB
  bih.writeUInt32LE(xorImage.length + andMask.length, 20); // biSizeImage
  bih.writeInt32LE(0, 24); // biXPelsPerMeter
  bih.writeInt32LE(0, 28); // biYPelsPerMeter
  bih.writeUInt32LE(0, 32); // biClrUsed
  bih.writeUInt32LE(0, 36); // biClrImportant

  return Buffer.concat([bih, xorImage, andMask]);
}

export async function syncIcons() {
  const source = await readFile('desktop/icon.png');
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const images = await Promise.all(sizes.map(size => generateIconImage(source, size)));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((data, i) => {
    const entry = 6 + i * 16;
    header[entry] = sizes[i] === 256 ? 0 : sizes[i];
    header[entry + 1] = sizes[i] === 256 ? 0 : sizes[i];
    header[entry + 2] = 0;
    header[entry + 3] = 0;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  const ico = Buffer.concat([header, ...images]);
  const apple = await sharp(source).resize(180, 180).png().toBuffer();
  await mkdir('src/app', { recursive: true });
  await Promise.all([
    writeIfChanged('desktop/icon.ico', ico),
    writeIfChanged('src/app/favicon.ico', ico),
    writeIfChanged('src/app/icon.png', source),
    writeIfChanged('src/app/apple-icon.png', apple),
  ]);
}

if (process.argv[1]?.endsWith('sync-icons.mjs')) await syncIcons();
