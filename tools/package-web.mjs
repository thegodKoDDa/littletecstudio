import { buildClient } from './build-client.mjs';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

// A entrada portátil renderiza os mesmos componentes, sem depender do servidor Next.
await buildClient('build/web-portable');
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
