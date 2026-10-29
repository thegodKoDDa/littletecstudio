import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const archive = `LittleTec-Studio-${version}-win-x64.zip`;
if (!existsSync(path.join('release', archive))) throw new Error('Pacote da versão atual ausente.');
run(python, ['-X', 'utf8', 'tools/build-launcher.py', '--payload', path.join('release', archive)]);
run(python, ['-X', 'utf8', 'tools/verify-windows-icons.py', 'desktop/icon.ico',
  'LittleTec-Studio.exe', 'release/win-unpacked/LittleTec-Studio.exe', bridge]);
writeFileSync('release/SHA256SUMS-desktop.txt', [archive, 'LittleTec-Studio.exe'].map(name => {
  const digest = createHash('sha256').update(readFileSync(path.join('release', name))).digest('hex');
  return `${digest}  ${name}`;
}).join('\n') + '\n');
console.log('Desktop gerado em release/. Nenhuma publicação executada.');
