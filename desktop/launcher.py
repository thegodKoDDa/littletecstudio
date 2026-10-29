"""Entrada Windows portátil: contém o pacote e o executa em disco local.

O executável pode estar no WSL/UNC. Não abre USB nem depende de Python instalado.
"""
import ctypes
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import zipfile


def prepare(payload, destination, digest):
    target = destination / digest[:24]
    executable = target / 'LittleTec-Studio.exe'
    if (target / '.ready').is_file() and executable.is_file():
        return executable
    if hashlib.sha256(payload.read_bytes()).hexdigest() != digest:
        raise RuntimeError('O pacote interno está incompleto. Baixe ou gere novamente o aplicativo.')
    destination.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix='preparing-', dir=destination))
    try:
        with zipfile.ZipFile(payload) as archive:
            archive.extractall(staging)
        if not (staging / 'LittleTec-Studio.exe').is_file():
            raise RuntimeError('Executável ausente no pacote interno.')
        (staging / '.ready').write_text(digest, encoding='ascii')
        try:
            staging.rename(target)
        except OSError:
            # Outra abertura pode ter terminado a extração do mesmo build.
            if not ((target / '.ready').is_file() and executable.is_file()):
                raise
        return executable
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def main():
    root = Path(sys._MEIPASS) if getattr(sys, 'frozen', False) else Path(__file__).parent
    metadata = json.loads((root / 'payload.json').read_text(encoding='utf-8'))
    data = Path(os.environ['LOCALAPPDATA']) / 'LittleTec Desktop'
    executable = prepare(root / 'payload.zip', data / 'builds', metadata['sha256'])
    arguments = [item for item in sys.argv[1:] if item in ('--smoke', '--smoke-close-window')]
    env = dict(os.environ)
    env.pop('ELECTRON_RUN_AS_NODE', None)
    with (data / 'launcher.log').open('a', encoding='utf-8') as log:
        log.write(f'{time.strftime("%Y-%m-%d %H:%M:%S")} Abrindo {metadata["version"]}: {executable}\n')
        log.flush()
        child = subprocess.Popen([str(executable), *arguments], cwd=executable.parent,
                                 env=env, stdin=subprocess.DEVNULL, stdout=log, stderr=log,
                                 creationflags=subprocess.CREATE_NO_WINDOW)
        if '--smoke' in arguments:
            return child.wait(timeout=60)
        try:
            code = child.wait(timeout=2)
            if code:
                raise RuntimeError(f'O aplicativo encerrou ao iniciar (código {code}). Detalhes: {data / "launcher.log"}')
        except subprocess.TimeoutExpired:
            pass
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception as error:
        if '--smoke' not in sys.argv:
            ctypes.windll.user32.MessageBoxW(None, str(error), 'LittleTec Studio', 0x10)
        raise SystemExit(1)
