"""Gera o .exe único de entrada, incluindo o ZIP desktop já compilado."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--payload', type=Path, required=True)
    args = parser.parse_args()
    if sys.platform != 'win32':
        raise SystemExit('Use o Python Windows do projeto.')
    payload = args.payload.resolve()
    staging = ROOT / 'build/launcher-data'
    staging.mkdir(parents=True, exist_ok=True)
    bundled_payload = staging / 'payload.zip'
    shutil.copy2(payload, bundled_payload)
    metadata = staging / 'payload.json'
    metadata.write_text(json.dumps({'sha256': hashlib.sha256(payload.read_bytes()).hexdigest(),
                                    'version': payload.stem}), encoding='utf-8')
    subprocess.run([
        sys.executable, '-m', 'PyInstaller', '--noconfirm', '--clean', '--onefile',
        '--windowed', '--name', 'LittleTec-Studio',
        '--add-data', f'{bundled_payload};.',
        '--add-data', f'{metadata};.',
        '--exclude-module', 'tkinter', '--exclude-module', 'PySide6',
        '--distpath', str(ROOT / 'build/launcher'),
        '--workpath', str(ROOT / 'build/launcher-work'),
        '--specpath', str(ROOT / 'build'), str(ROOT / 'desktop/launcher.py'),
    ], check=True)
    for target in (ROOT / 'LittleTec-Studio.exe', ROOT / 'release/LittleTec-Studio.exe'):
        shutil.copy2(ROOT / 'build/launcher/LittleTec-Studio.exe', target)


if __name__ == '__main__':
    main()
