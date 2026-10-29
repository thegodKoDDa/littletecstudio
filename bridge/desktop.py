"""Ponte privada do Electron por JSONL em stdin/stdout; sem servidor de rede.

Iniciar não enumera, abre ou escreve no teclado. EOF aguarda as operações em
curso (incluindo releitura/retorno) antes de fechar o monitor e o processo.
"""
from concurrent.futures import ThreadPoolExecutor
import json
import sys
from threading import Lock

from server import Application


def serve(input_stream, output_stream, application=None):
    application = application or Application()
    output_lock = Lock()

    def respond(message):
        with output_lock:
            output_stream.write(json.dumps(message, ensure_ascii=False) + '\n')
            output_stream.flush()

    def execute(request):
        request_id = request.get('id')
        try:
            body = application.execute(request.get('command'))
            status = 200
        except (ValueError, KeyError, TypeError) as error:
            status, body = 400, {'error': str(error)}
        except Exception as error:
            status, body = 409, {'error': str(error)}
        respond({'id': request_id, 'status': status, 'body': body})

    try:
        # Long polling não impede a fila de configuração serial do Application.
        with ThreadPoolExecutor(max_workers=4, thread_name_prefix='LittleTec') as pool:
            respond({'ready': True})
            for line in input_stream:
                try:
                    if len(line) > 1_000_000:
                        raise ValueError('Comando muito grande.')
                    request = json.loads(line)
                    if not isinstance(request, dict) or type(request.get('id')) is not int:
                        raise ValueError('Identificador inválido.')
                    pool.submit(execute, request)
                except (ValueError, TypeError) as error:
                    respond({'id': None, 'status': 400, 'body': {'error': str(error)}})
    finally:
        application.live.close()


if __name__ == '__main__':
    if hasattr(sys.stdin, 'reconfigure'):
        sys.stdin.reconfigure(encoding='utf-8')
        sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    serve(sys.stdin, sys.stdout)
