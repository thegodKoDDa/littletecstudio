import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

async function writeIfChanged(filename, content) {
  try { if (content.equals(await readFile(filename))) return; } catch { /* Primeiro build. */ }
  await writeFile(filename, content);
}

export async function syncIcons() {
  const source = await readFile('desktop/icon.png');
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const images = await Promise.all(sizes.map(size => sharp(source).resize(size, size).png().toBuffer()));
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  images.forEach((data, i) => {
    const entry = 6 + i * 16;
    header[entry] = header[entry + 1] = sizes[i] === 256 ? 0 : sizes[i];
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
