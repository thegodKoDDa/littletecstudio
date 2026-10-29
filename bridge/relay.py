"""Encaminha um pedido por stdin ao loopback Windows; não abre HID.

Usado pelo Next em WSL/NAT. Token nunca é passado por argumento de processo.
Não repete pedidos após falhas: uma gravação pode já estar em andamento.
"""
import json
import sys
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def main():
    envelope = json.loads(sys.stdin.buffer.read(1_000_001))
    request = Request('http://127.0.0.1:17643/command',
                      data=json.dumps(envelope['command']).encode('utf-8'),
                      headers={'Content-Type': 'application/json',
                               'X-LittleTec-Token': envelope['token']})
    try:
        response = urlopen(request, timeout=3 if envelope['command'].get('operation') == 'status' else 180)
    except HTTPError as error:
        response = error
    with response:
        result = {'status': response.status, 'body': json.loads(response.read(1_000_001))}
    sys.stdout.write(json.dumps(result, ensure_ascii=True))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Não imprimir envelope, token ou conteúdo do perfil.
        print(f'Ponte Windows indisponível: {type(error).__name__}.', file=sys.stderr)
        sys.exit(1)
