import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAutoConnect } from '../src/lib/auto-connect';

const local = { protocol: 'http:', hostname: 'localhost', search: '' };
test('conexão automática só tenta a ponte no Desktop e no Web local', () => {
  assert.equal(shouldAutoConnect(local, undefined, null), true);
  assert.equal(shouldAutoConnect({ ...local, hostname: '127.0.0.1' }, undefined, null), true);
  assert.equal(shouldAutoConnect({ ...local, hostname: 'thegodkodda.github.io' }, undefined, null), false);
  assert.equal(shouldAutoConnect({ protocol: 'file:', hostname: '', search: '' }, undefined, null), false);
  assert.equal(shouldAutoConnect({ protocol: 'littletec:', hostname: 'studio', search: '' }, { autoConnect: true }, null), true);
});
test('smoke, preferência offline e URL offline desabilitam leitura automática', () => {
  assert.equal(shouldAutoConnect(local, { autoConnect: false }, null), false);
  assert.equal(shouldAutoConnect(local, undefined, 'off'), false);
  assert.equal(shouldAutoConnect({ ...local, search: '?offline=1' }, undefined, null), false);
});
