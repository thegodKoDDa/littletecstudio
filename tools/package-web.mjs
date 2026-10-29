import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

// A entrada portátil renderiza os mesmos componentes, sem depender do servidor Next.
const output = 'build/web-portable';
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
await build({
  entryPoints: ['src/portable.tsx'], bundle: true, minify: true,
  format: 'iife', platform: 'browser', target: 'es2022', jsx: 'automatic',
  outfile: `${output}/studio.js`, assetNames: 'assets/[name]-[hash]',
  loader: { '.ttf': 'file' }, define: { 'process.env.NODE_ENV': '"production"' },
});
copyFileSync('src/app/icon.svg', `${output}/icon.svg`);
writeFileSync(`${output}/index.html`, `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LittleTec Studio — Editor portátil</title><link rel="icon" href="./icon.svg"><link rel="stylesheet" href="./studio.css"><script defer src="./studio.js"></script></head><body><div id="studio"></div></body></html>`);
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
mkdirSync('release', { recursive: true });
const archive = `release/LittleTec-Studio-Web-${version}.zip`;
const python = process.platform === 'win32' ? 'python' : 'python3';
const zipped = spawnSync(python, ['-c',
  "from pathlib import Path; from zipfile import ZipFile,ZIP_DEFLATED; import sys; root=Path('build/web-portable'); z=ZipFile(sys.argv[1],'w',ZIP_DEFLATED); [z.write(p,p.relative_to(root).as_posix()) for p in sorted(root.rglob('*')) if p.is_file()]; z.close()", archive,
], { stdio: 'inherit' });
if (zipped.status !== 0) process.exit(zipped.status || 1);
writeFileSync('release/SHA256SUMS-web.txt', `${createHash('sha256').update(readFileSync(archive)).digest('hex')}  ${path.basename(archive)}\n`);
console.log(`Editor Web portátil: ${archive}`);
