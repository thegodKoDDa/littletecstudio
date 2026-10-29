import test from 'node:test';
import assert from 'node:assert/strict';
import { DesktopBridge } from '../desktop/bridge';
import { deviceCommandSchema } from '../src/lib/device-command';

test('desktop e Web compartilham validação de comandos', () => {
  assert.deepEqual(deviceCommandSchema.parse({ operation: 'status' }), { operation: 'status' });
  assert.equal(deviceCommandSchema.safeParse({ operation: 'apply', profile: {} }).success, false);
  assert.equal(deviceCommandSchema.safeParse({ operation: 'led', mode: 8, layer: 1 }).success, false);
  assert.equal(deviceCommandSchema.safeParse({ operation: 'firmware' }).success, false);
});

test('ponte real inicia sem USB, responde por id e encerra por EOF', async () => {
  const bridge = new DesktopBridge('python3', ['-X', 'utf8', 'bridge/desktop.py'], process.cwd());
  try {
    await bridge.ready;
    const responses = await Promise.all(Array.from({ length: 5 }, () => bridge.request({ operation: 'status' })));
    for (const response of responses) {
      assert.equal(response.status, 200);
      assert.equal(response.body.bridge, true);
      assert.equal(response.body.connected, false);
    }
    const invalid = await bridge.request({ operation: 'invalid' });
    assert.equal(invalid.status, 400);
    assert.match(String(invalid.body.error), /desconhecida/);
  } finally { await bridge.close(); }
  await assert.rejects(bridge.request({ operation: 'status' }), /indisponível/);
});

test('fechar aguarda comando aceito e não repete em falha', async () => {
  const script = `import sys,json,time
print(json.dumps({'ready':True}),flush=True)
for line in sys.stdin:
 r=json.loads(line)
 time.sleep(0.15)
 print(json.dumps({'id':r['id'],'status':200,'body':{'done':True}}),flush=True)
`;
  const bridge = new DesktopBridge('python3', ['-u', '-c', script], process.cwd());
  await bridge.ready;
  const response = bridge.request({ operation: 'simulated' });
  await new Promise(resolve => setTimeout(resolve, 30));
  await bridge.close();
  assert.equal((await response).body.done, true);
});

test('falha do processo é propagada sem reiniciar nem reenviar', async () => {
  const bridge = new DesktopBridge('python3', ['-u', '-c', `import sys,json,os
print(json.dumps({'ready':True}),flush=True)
sys.stdin.readline()
os._exit(2)
`], process.cwd());
  await bridge.ready;
  await assert.rejects(bridge.request({ operation: 'simulated' }), /encerrada/);
  await bridge.close();
});
