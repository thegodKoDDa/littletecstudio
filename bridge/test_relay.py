import io
import json
from types import SimpleNamespace
import unittest
from unittest.mock import patch
from urllib.error import HTTPError, URLError
import relay


class RelayTests(unittest.TestCase):
    def invoke(self, command, response=None, error=None):
        output = io.StringIO()
        source = SimpleNamespace(buffer=io.BytesIO(json.dumps({'token': 'test-token', 'command': command}).encode()))
        with patch.object(relay.sys, 'stdin', source), patch.object(relay.sys, 'stdout', output), patch.object(relay, 'urlopen', return_value=response, side_effect=error) as opened:
            relay.main()
        return json.loads(output.getvalue()), opened

    def test_windows_loopback_and_token_are_used_without_hid(self):
        response = io.BytesIO(b'{"bridge":true,"usb_platform":true}')
        response.status = 200
        result, opened = self.invoke({'operation': 'status'}, response)
        self.assertEqual(result['status'], 200)
        self.assertTrue(result['body']['usb_platform'])
        request = opened.call_args.args[0]
        self.assertEqual(request.full_url, 'http://127.0.0.1:17643/command')
        self.assertEqual(request.get_header('X-littletec-token'), 'test-token')
        self.assertEqual(opened.call_args.kwargs['timeout'], 3)

    def test_http_error_preserves_service_message(self):
        error = HTTPError('http://127.0.0.1:17643/command', 400, 'Bad Request', {}, io.BytesIO(b'{"error":"Leia novamente."}'))
        result, opened = self.invoke({'operation': 'apply'}, error=error)
        self.assertEqual(result, {'status': 400, 'body': {'error': 'Leia novamente.'}})
        self.assertEqual(opened.call_count, 1)

    def test_transport_failure_does_not_retry_a_write(self):
        source = SimpleNamespace(buffer=io.BytesIO(b'{"token":"test-token","command":{"operation":"apply"}}'))
        with patch.object(relay.sys, 'stdin', source), patch.object(relay, 'urlopen', side_effect=URLError('closed')) as opened:
            with self.assertRaises(URLError):
                relay.main()
        self.assertEqual(opened.call_count, 1)


if __name__ == '__main__':
    unittest.main()
