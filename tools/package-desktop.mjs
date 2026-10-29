import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pythonRuntime } from './python-runtime.mjs';

function run(executable, args) {
  const result = spawnSync(executable, args, { stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

run(process.execPath, ['tools/build-desktop.mjs']);
const python = process.env.LITTLETEC_PYTHON || pythonRuntime().executable;
run(python, ['-X', 'utf8', 'tools/build-bridge.py']);
const bridge = 'build/bridge/LittleTec-Bridge/LittleTec-Bridge.exe';
if (!existsSync(bridge)) throw new Error('A ponte Windows não foi gerada.');
run(process.execPath, ['node_modules/electron-builder/cli.js', '--win', 'zip', '--x64', '--publish', 'never']);
const { readdirSync } = await import('node:fs');
const archives = readdirSync('release').filter(name => /^LittleTec-Studio-.*-win-x64\.zip$/.test(name));
const newest = [...archives].sort((a, b) => statSync(path.join('release', b)).mtimeMs - statSync(path.join('release', a)).mtimeMs)[0];
run(python, ['-X', 'utf8', 'tools/build-launcher.py', '--payload', path.join('release', newest)]);
writeFileSync('release/SHA256SUMS-desktop.txt', [...archives, 'LittleTec-Studio.exe'].map(name => {
  const digest = createHash('sha256').update(readFileSync(path.join('release', name))).digest('hex');
  return `${digest}  ${name}`;
}).join('\n') + '\n');
console.log('Desktop gerado em release/. Nenhuma publicação executada.');
