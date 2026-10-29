"""Regressões sem USB: fronteira web, serialização e invalidação de leitura."""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from pathlib import Path
import sys
from threading import Thread
from http.server import ThreadingHTTPServer
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import json
import hashlib
import tempfile
import time
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
from server import Application, make_handler
from littletec.profile import new_profile
from littletec.protocol import encode_record, READ_TO_WRITE


def backup_sample():
    files = {}
    manifest = {'complete': True, 'identity': {'key_count': 12, 'encoder_count': 2, 'variant': 0},
                'encoder_header_policy': 'stored-id-in-fixed-trios-v1', 'files': []}
    layers = []
    for layer in (1, 2, 3):
        packets = [b'\x03\xfa' + encode_record({'type': 'none'}, READ_TO_WRITE[i], layer)[1:] + bytes(14) for i in range(1, 25)]
        raw = b''.join(packets)
        name = f'layer-{layer}.bin'
        files[name] = raw.hex()
        layers.append(packets)
        manifest['files'].append({'path': name, 'size': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()})
    return {'format': 'littletec-backup', 'manifest': manifest, 'files': files}, layers


class Service:
    def __init__(self):
        self.sent = []
        self.fail = False
        self.active = 0
        self.max_active = 0
        self.snapshot = {'profile': new_profile(), 'identity': {'key_count': 12, 'encoder_count': 2, 'variant': 0}}

    def read(self):
        self.active += 1
        self.max_active = max(self.active, self.max_active)
        time.sleep(0.005)
        self.active -= 1
        return deepcopy(self.snapshot)

    def last_led(self, *_):
        return None

    def apply_keys(self, snapshot, profile):
        if self.fail:
            raise RuntimeError('Retorno não confirmado.')
        self.sent.append(deepcopy(profile))
        return {'snapshot': self.snapshot, 'message': 'Mapeamento conferido.'}


class BridgeTests(unittest.TestCase):
    def test_live_input_never_assigns_an_event_using_a_mapping_mid_write(self):
        service=Service();app=Application(service)
        app.snapshot=service.snapshot
        app.snapshot['profile']['layers'][0][14]={'type':'media','command':'volume_up'}
        event={'kind':'media','phase':'press','action':{'type':'media','command':'volume_up'}}
        app.applying=True;app.live.emit(event)
        self.assertEqual(app.live.buffer[-1]['targets'],[])
        app.applying=False;app.live.emit(event)
        self.assertEqual(app.live.buffer[-1]['targets'],[{'layer':0,'position':14}])

    def test_health_does_not_wait_for_the_device_queue(self):
        app = Application(Service())
        with ThreadPoolExecutor(max_workers=1) as executor:
            with app.lock:
                status = executor.submit(app.execute, {'operation': 'status'}).result(timeout=0.5)
                self.assertTrue(status['bridge'])
                self.assertTrue(status['busy'])

    def test_no_write_without_read_and_no_raw_usb_endpoint(self):
        service = Service()
        app = Application(service)
        with self.assertRaises(ValueError):
            app.execute({'operation': 'apply', 'profile': new_profile(), 'revision': app.revision})
        with self.assertRaises(ValueError):
            app.execute({'operation': 'send', 'bytes': [3, 239]})
        self.assertFalse(service.sent)

    def test_profile_validated_and_result_excludes_raw_snapshot(self):
        service = Service()
        app = Application(service)
        self.assertIn('profile', app.execute({'operation': 'read'}))
        result = app.execute({'operation': 'apply', 'profile': new_profile(), 'revision': app.revision})
        self.assertNotIn('snapshot', result)
        self.assertEqual(len(service.sent), 1)
        with self.assertRaises(ValueError):
            app.execute({'operation': 'apply', 'profile': {'format': 'other'}, 'revision': app.revision})

    def test_failure_invalidates_snapshot(self):
        service = Service()
        app = Application(service)
        app.execute({'operation': 'read'})
        service.fail = True
        with self.assertRaises(RuntimeError):
            app.execute({'operation': 'apply', 'profile': new_profile(), 'revision': app.revision})
        self.assertIsNone(app.snapshot)

    def test_concurrent_requests_serialize_device_access(self):
        service = Service()
        app = Application(service)
        with ThreadPoolExecutor(max_workers=4) as executor:
            list(executor.map(lambda _: app.execute({'operation': 'read'}), range(8)))
        self.assertEqual(service.max_active, 1)

    def test_outdated_tab_cannot_apply_to_new_snapshot(self):
        service = Service()
        app = Application(service)
        old = app.execute({'operation': 'read'})['revision']
        app.execute({'operation': 'read'})
        with self.assertRaisesRegex(ValueError, 'Outra sessão'):
            app.execute({'operation': 'apply', 'profile': new_profile(), 'revision': old})
        self.assertFalse(service.sent)

    def test_http_rejects_missing_token_and_browser_origin(self):
        app = Application(Service())
        server = ThreadingHTTPServer(('127.0.0.1', 0), make_handler(app, 'test-token'))
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            url = f'http://127.0.0.1:{server.server_port}/command'
            for headers in ({}, {'X-LittleTec-Token': 'test-token', 'Origin': 'http://example.com'}):
                request = Request(url, data=b'{"operation":"read"}', headers=headers)
                with self.assertRaises(HTTPError) as result:
                    urlopen(request)
                self.assertEqual(result.exception.code, 403)
                result.exception.close()
            self.assertIsNone(app.snapshot)
            request = Request(url, data=b'{"operation":"status"}', headers={'X-LittleTec-Token': 'test-token'})
            with urlopen(request) as response:
                self.assertTrue(json.load(response)['bridge'])
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_backup_import_checks_hashes_without_adopting_hardware_snapshot(self):
        app = Application(Service())
        backup, _ = backup_sample()
        result = app.execute({'operation': 'backup_import', 'backup': backup})
        self.assertEqual(result['profile']['key_count'], 12)
        self.assertIsNone(app.snapshot)
        backup['files']['layer-1.bin'] = '00' + backup['files']['layer-1.bin'][2:]
        with self.assertRaisesRegex(ValueError, 'Integridade inválida'):
            app.execute({'operation': 'backup_import', 'backup': backup})

    def test_backup_export_preserves_raw_reports(self):
        service = Service()
        backup, layers = backup_sample()
        service.snapshot.update(manifest=backup['manifest'], raw_layers=layers)
        app = Application(service)
        revision = app.execute({'operation': 'read'})['revision']
        result = app.execute({'operation': 'backup_export', 'revision': revision})
        self.assertEqual(result['backup'], backup)

    def test_partial_lighting_failure_invalidates_previous_known_commands(self):
        with tempfile.TemporaryDirectory() as folder:
            service = Service()
            service.root = Path(folder)
            def fail(*_):
                raise RuntimeError('Envio interrompido na segunda camada.')
            service.apply_led_all_layers = fail
            for layer in (1, 2, 3):
                (service.root / f'last-led-layer-{layer}.json').write_text('{"status":"sent"}')
            app = Application(service)
            revision = app.execute({'operation': 'read'})['revision']
            with self.assertRaises(RuntimeError):
                app.execute({'operation': 'led_all', 'mode': 1, 'color': 'green', 'revision': revision})
            for layer in (1, 2, 3):
                state = json.loads((service.root / f'last-led-layer-{layer}.json').read_text())
                self.assertEqual(state['status'], 'unknown')


if __name__ == '__main__':
    unittest.main()
