"""Compila a entrada portátil .NET Windows, sem extração Python a cada abertura."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--payload', type=Path, required=True)
    args = parser.parse_args()
    if sys.platform != 'win32':
        raise SystemExit('Use o Python Windows do projeto.')
    payload = args.payload.resolve()
    version = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
    compiler = Path(os.environ['WINDIR']) / 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
    if not compiler.is_file():
        raise SystemExit('Compilador .NET Framework do Windows não encontrado.')
    with tempfile.TemporaryDirectory(prefix='littletec-launcher-build-') as directory:
        staging = Path(directory)
        archive = staging / 'payload.zip'
        shutil.copy2(payload, archive)
        sha = staging / 'payload.sha256'
        sha.write_text(hashlib.sha256(archive.read_bytes()).hexdigest(), encoding='ascii')
        tag = staging / 'payload.version'
        tag.write_text(version, encoding='utf-8')
        product = staging / 'version.cs'
        product.write_text('\n'.join([
            'using System.Reflection;',
            '[assembly: AssemblyTitle("LittleTec Studio")]',
            '[assembly: AssemblyProduct("LittleTec Studio")]',
            '[assembly: AssemblyCompany("LittleTec")]',
            f'[assembly: AssemblyVersion("{version}.0")]',
            f'[assembly: AssemblyFileVersion("{version}.0")]',
        ]), encoding='utf-8')
        output = staging / 'LittleTec-Studio.exe'
        subprocess.run([
            str(compiler), '/nologo', '/codepage:65001', '/target:winexe', '/platform:x64', '/optimize+',
            '/reference:System.IO.Compression.dll', '/reference:System.IO.Compression.FileSystem.dll',
            '/reference:System.Windows.Forms.dll', '/reference:System.Drawing.dll',
            f'/win32icon:{ROOT / "desktop/icon.ico"}',
            f'/resource:{archive},payload.zip', f'/resource:{sha},payload.sha256',
            f'/resource:{tag},payload.version', f'/resource:{ROOT / "desktop/icon.png"},icon.png',
            f'/resource:{ROOT / "desktop/icon.ico"},icon.ico', f'/out:{output}',
            str(ROOT / 'desktop/launcher.cs'), str(product),
        ], check=True)
        for target in (ROOT / 'LittleTec-Studio.exe', ROOT / 'release/LittleTec-Studio.exe'):
            shutil.copy2(output, target)
    print('Executável portátil com ícone oficial e cache de abertura gerado.')


if __name__ == '__main__':
    main()
