"""Ponte HTTP local: reutiliza o serviço do Studio, sem construir bytes USB.

Executar com Python Windows. Sem leitura ou escrita automática ao iniciar.
Apenas o servidor Next local acessa a ponte, usando token fora do navegador.
"""
from __future__ import annotations

import argparse
from hmac import compare_digest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import secrets
import sys
import tempfile
from threading import Lock

WEB_ROOT = Path(__file__).resolve().parents[1]
core_dir = Path(__file__).resolve().parent / "core"
if core_dir.exists():
    sys.path.insert(0, str(core_dir))
else:
    sys.path.insert(0, str(WEB_ROOT.parent / 'novo' / 'src'))

from littletec.configuration_service import ConfigurationService
from littletec.profile import validate
from littletec.device_service import load_backup
from live_input import LiveInput


class Application:
    def __init__(self, service=None):
        self.service = service or ConfigurationService()
        self.snapshot = None
        self.revision = None
        self.lock = Lock()
        self.applying = False
        self.live = LiveInput(lambda: self.snapshot['profile'] if self.snapshot and not self.applying else None)

    def execute(self, command):
        if not isinstance(command, dict):
            raise ValueError('Comando inválido.')
        operation = command.get('operation')
        if operation == 'status':
            return {'bridge': True, 'connected': self.snapshot is not None,
                    'usb_platform': sys.platform == 'win32', 'busy': self.lock.locked()}
        if operation in ('live_start','live_events','live_stop'):
            client = command.get('client')
            if not isinstance(client,str) or not 1<=len(client)<=80:
                raise ValueError('Sessão ao vivo inválida.')
            if operation == 'live_stop':
                return self.live.stop(client)
            if self.snapshot is None:
                raise ValueError('Conecte o teclado antes de ativar a entrada ao vivo.')
            if operation == 'live_start':
                return self.live.start(client)
            cursor = command.get('cursor',0)
            if type(cursor) is not int or cursor<0:
                raise ValueError('Cursor de eventos inválido.')
            return self.live.poll(client,cursor)
        # Leitura/aplicação são serializadas inclusive entre abas do navegador.
        with self.lock:
            if operation == 'diagnose':
                from littletec.diagnostics import collect_report
                return {'diagnostic': collect_report()}
            if operation == 'backup_import':
                backup = command.get('backup', {})
                if not isinstance(backup, dict) or backup.get('format') != 'littletec-backup':
                    raise ValueError('Formato de cópia inválido.')
                files = backup.get('files', {})
                expected = {f'layer-{i}.bin' for i in (1, 2, 3)}
                if not isinstance(files, dict) or set(files) != expected:
                    raise ValueError('A cópia requer exatamente três arquivos de camada.')
                with tempfile.TemporaryDirectory(prefix='littletec-web-import-') as folder:
                    root = Path(folder)
                    for name in expected:
                        data = bytes.fromhex(files[name])
                        if len(data) != 1560:
                            raise ValueError('Camada bruta deve conter 24 relatórios de 65 bytes.')
                        (root / name).write_bytes(data)
                    (root / 'manifest.json').write_text(json.dumps(backup.get('manifest')), encoding='utf-8')
                    loaded = load_backup(root)  # Confere os três SHA-256 e toda a estrutura.
                    return {'profile': loaded['profile'], 'message': 'Cópia importada com hashes verificados. Nenhum envio USB.'}
            if operation == 'read':
                self.snapshot = self.service.read()
                self.revision = secrets.token_hex(16)
                return {'profile': self.snapshot['profile'], 'identity': self.snapshot['identity'],
                        'revision': self.revision,
                        'liveAvailable': sys.platform == 'win32',
                        'lastLighting': [self.service.last_led(self.snapshot, i) for i in (1, 2, 3)]}
            if operation not in ('apply', 'led', 'led_all', 'backup_export'):
                raise ValueError('Operação desconhecida.')
            if self.snapshot is None:
                raise ValueError('Leia o teclado antes de aplicar alterações.')
            if command.get('revision') != self.revision:
                raise ValueError('Outra sessão atualizou o teclado. Leia novamente antes de aplicar.')
            if operation == 'backup_export':
                return {'backup': {'format': 'littletec-backup', 'manifest': self.snapshot['manifest'],
                                   'files': {f'layer-{i}.bin': b''.join(layer).hex() for i, layer in enumerate(self.snapshot['raw_layers'], 1)}}}
            self.applying = True
            try:
                if operation == 'apply':
                    profile = validate(command.get('profile'))
                    if (profile['key_count'], profile['encoder_count']) != (12, 2):
                        raise ValueError('O dispositivo conectado requer um perfil 12+2.')
                    result = self.service.apply_keys(self.snapshot, profile)
                elif operation == 'led':
                    result = self.service.apply_led(command.get('mode'), command.get('color'), command.get('layer'), self.snapshot)
                else:
                    result = self.service.apply_led_all_layers(command.get('mode'), command.get('color'), self.snapshot)
                self.snapshot = result['snapshot']
            except Exception:
                # Uma falha pode ter concluído retorno: exigir nova leitura explícita.
                self.snapshot = None
                self.revision = None
                if operation in ('led', 'led_all') and hasattr(self.service, 'root'):
                    # A aplicação de várias camadas pode ter sido parcial. Um último
                    # envio antigo não pode reaparecer como referência conhecida.
                    from littletec.lighting_service import write_json
                    layers = (1, 2, 3) if operation == 'led_all' else (command.get('layer'),)
                    for layer in layers:
                        if layer in (1, 2, 3):
                            try:
                                write_json(self.service.root / f'last-led-layer-{layer}.json',
                                           {'status': 'unknown', 'led_readback': False,
                                            'reason': 'Aplicação web não concluída.'})
                            except OSError:
                                pass  # Preservar o erro original do serviço.
                raise
            finally:
                self.applying = False
            self.revision = secrets.token_hex(16)
            return {**{key: value for key, value in result.items() if key != 'snapshot'}, 'revision': self.revision}


def make_handler(application, token):
    class Handler(BaseHTTPRequestHandler):
        def respond(self, status, data):
            encoded = json.dumps(data, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(encoded)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(encoded)

        def do_POST(self):
            if self.path != '/command':
                self.respond(404, {'error': 'Rota desconhecida.'})
                return
            # Sem CORS e sem autorização para chamadas diretas do navegador.
            if self.headers.get('Origin') or not compare_digest(self.headers.get('X-LittleTec-Token', ''), token):
                self.respond(403, {'error': 'Acesso não autorizado.'})
                return
            try:
                length = int(self.headers.get('Content-Length', '0'))
                if not 0 < length <= 1_000_000:
                    self.respond(413, {'error': 'Tamanho de comando inválido.'})
                    return
                body = json.loads(self.rfile.read(length))
                self.respond(200, application.execute(body))
            except (ValueError, KeyError, TypeError) as error:
                self.respond(400, {'error': str(error)})
            except Exception as error:
                self.respond(409, {'error': str(error)})

        def log_message(self, *_):
            # Não registrar perfis, token ou dados brutos no terminal HTTP.
            pass

    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=17643)
    args = parser.parse_args()
    runtime = WEB_ROOT / '.runtime'
    runtime.mkdir(mode=0o700, exist_ok=True)
    token_path = runtime / 'bridge-token'
    token = secrets.token_hex(32)
    application = Application()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), make_handler(application, token))
    # Ao fechar normalmente, aguardar pedidos em curso, inclusive releitura/retorno.
    server.daemon_threads = False
    token_path.write_text(token, encoding='utf-8')
    if os.name != 'nt':
        token_path.chmod(0o600)
    print(f'LittleTec Web — ponte local em 127.0.0.1:{args.port}', flush=True)
    print('Nenhuma operação USB é executada até um pedido na interface.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        application.live.close()
        if token_path.exists() and token_path.read_text(encoding='utf-8') == token:
            token_path.unlink()


if __name__ == '__main__':
    main()
