import test from "node:test";
import assert from "node:assert/strict";
import { pythonRuntime } from "../tools/python-runtime.mjs";

test("WSL escolhe Python Windows e relay, sem depender da rede NAT", () => {
  const runtime = pythonRuntime({
    root: "/project/web",
    platform: "linux",
    kernel: "6.6-microsoft-standard-WSL2",
    exists: () => true,
  });
  assert.equal(runtime.usb, true);
  assert.equal(runtime.relay, true);
  assert.match(runtime.executable, /Scripts\/python\.exe$/);
});
test("Windows usa seu loopback diretamente", () => {
  const runtime = pythonRuntime({
    root: "/project/web",
    platform: "win32",
    kernel: "Windows_NT",
    exists: () => true,
  });
  assert.equal(runtime.usb, true);
  assert.equal(runtime.relay, false);
});
test("Linux sem transporte Windows permanece editor sem USB", () => {
  const runtime = pythonRuntime({
    root: "/project/web",
    platform: "linux",
    kernel: "Linux",
    exists: () => false,
  });
  assert.equal(runtime.usb, false);
  assert.equal(runtime.relay, false);
  assert.equal(runtime.executable, "python3");
});
