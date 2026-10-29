const { spawnSync } = require('node:child_process');
const path = require('node:path');

module.exports = async context => {
  if (context.electronPlatformName !== 'win32') return;
  const root = context.packager.projectDir;
  const python = process.env.LITTLETEC_PYTHON || path.join(root, '.venv-windows', 'Scripts', 'python.exe');
  const executable = path.join(context.appOutDir, 'LittleTec-Studio.exe');
  const windowsPath = filename => {
    if (process.platform === 'win32') return filename;
    const result = spawnSync('wslpath', ['-w', filename], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error('Não foi possível converter o caminho Windows.');
    return result.stdout.trim();
  };
  const { status, error } = spawnSync(python, [path.join(root, 'tools/set-windows-icon.py'), executable, path.join(root, 'desktop/icon.ico')].map(windowsPath), {
    cwd: root, stdio: 'inherit', windowsHide: true,
  });
  if (error) throw error;
  if (status !== 0) throw new Error('Não foi possível incorporar o ícone do projeto.');
};
