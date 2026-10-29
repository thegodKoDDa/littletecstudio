"""Empacota somente a ponte Python Windows, sem acessar o teclado."""
from importlib.metadata import distribution
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    if sys.platform != 'win32':
        raise SystemExit('Execute com o Python Windows de .venv-windows.')
    licenses = []
    package = distribution('hidapi')
    for item in package.files or []:
        if '.dist-info/licenses/' in str(item).replace('\\', '/'):
            licenses += ['--add-data', f'{package.locate_file(item)};licenses/hidapi']
    subprocess.run([
        sys.executable, '-m', 'PyInstaller', '--noconfirm', '--clean', '--onedir',
        '--console', '--name', 'LittleTec-Bridge',
        '--paths', str(ROOT / 'bridge/core'), '--paths', str(ROOT / 'bridge'),
        '--add-data', f'{ROOT / "bridge/core/tools"};tools',
        '--add-data', f'{ROOT / "LICENSE"};licenses',
        '--hidden-import', 'hid', '--hidden-import', 'ctypes.wintypes',
        '--hidden-import', 'littletec.configuration_service',
        '--hidden-import', 'raw_input_windows',
        '--exclude-module', 'tkinter', '--exclude-module', 'PySide6',
        '--distpath', str(ROOT / 'build/bridge'),
        '--workpath', str(ROOT / 'build/pyinstaller'),
        '--specpath', str(ROOT / 'build'),
        *licenses, str(ROOT / 'bridge/desktop.py'),
    ], check=True)


if __name__ == '__main__':
    main()
