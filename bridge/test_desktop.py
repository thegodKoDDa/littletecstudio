import io
import json
import time
import unittest
from desktop import serve


class FakeLive:
    closed = False

    def close(self):
        self.closed = True


class FakeApplication:
    def __init__(self):
        self.live = FakeLive()
        self.commands = []

    def execute(self, command):
        self.commands.append(command)
        time.sleep(0.03)
        if command == 'invalid':
            raise ValueError('Comando inválido.')
        return {'done': command}


class DesktopTests(unittest.TestCase):
    def test_eof_waits_for_commands_and_closes_live(self):
        app = FakeApplication()
        output = io.StringIO()
        serve(io.StringIO('{"id":1,"command":"valid"}\n{"id":2,"command":"invalid"}\n'), output, app)
        rows = [json.loads(line) for line in output.getvalue().splitlines()]
        self.assertEqual(rows[0], {'ready': True})
        responses = {row['id']: row for row in rows[1:]}
        self.assertEqual(responses[1]['body'], {'done': 'valid'})
        self.assertEqual(responses[2]['status'], 400)
        self.assertTrue(app.live.closed)
        self.assertCountEqual(app.commands, ['valid', 'invalid'])

    def test_malformed_request_never_reaches_application(self):
        app = FakeApplication()
        output = io.StringIO()
        serve(io.StringIO('[]\n{"id":true}\ninvalid\n'), output, app)
        rows = [json.loads(line) for line in output.getvalue().splitlines()]
        self.assertTrue(all(row['status'] == 400 for row in rows[1:]))
        self.assertEqual(app.commands, [])
        self.assertTrue(app.live.closed)


if __name__ == '__main__':
    unittest.main()
