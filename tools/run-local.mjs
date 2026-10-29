import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pythonRuntime } from "./python-runtime.mjs";

const mode = process.argv[2];
if (!["dev", "start"].includes(mode))
  throw new Error("Use run-local.mjs dev ou start.");
const root = process.cwd();
const runtime = pythonRuntime();
let ownedBridge = null;
let next = null;
let stopping = false;

async function runningBridge() {
  try {
    const token = (
      await readFile(path.join(root, ".runtime/bridge-token"), "utf8")
    ).trim();
    if (!runtime.relay) {
      const response = await fetch("http://127.0.0.1:17643/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-LittleTec-Token": token,
        },
        body: JSON.stringify({ operation: "status" }),
        signal: AbortSignal.timeout(3000),
      });
      return response.ok && (await response.json()).bridge === true;
    }
    return await new Promise((resolve) => {
      const child = spawn(
        runtime.executable,
        ["-X", "utf8", "bridge/relay.py"],
        { cwd: root, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] },
      );
      let output = "";
      child.stdout.on("data", (data) => (output += data));
      child.stderr.resume();
      child.on("error", () => resolve(false));
      child.stdin.on("error", () => resolve(false));
      child.on("close", (code) => {
        try {
          const r = JSON.parse(output);
          resolve(code === 0 && r.status === 200 && r.body.bridge === true);
        } catch {
          resolve(false);
        }
      });
      child.stdin.end(
        JSON.stringify({ token, command: { operation: "status" } }),
      );
    });
  } catch {
    return false;
  }
}

async function startBridge() {
  if (await runningBridge()) {
    console.log("LittleTec: ponte local já está ativa.");
    return;
  }
  console.log(
    `LittleTec: iniciando ponte ${runtime.usb ? "Windows / USB" : "local / editor sem USB"}…`,
  );
  ownedBridge = spawn(runtime.executable, ["-X", "utf8", "bridge/server.py"], {
    cwd: root,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("A ponte não iniciou no prazo.")),
      20000,
    );
    const finish = (error) => {
      clearTimeout(timer);
      error ? reject(error) : resolve();
    };
    ownedBridge.on("error", finish);
    ownedBridge.on("exit", (code) => {
      if (!stopping) finish(new Error(`Ponte encerrada (${code}).`));
    });
    ownedBridge.stdout.on("data", (data) => {
      const message = data.toString();
      process.stdout.write(message);
      if (message.includes("ponte local em")) finish();
    });
    ownedBridge.stderr.on("data", (data) => process.stderr.write(data));
  });
}

function stop(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  next?.kill(signal);
  ownedBridge?.kill(signal);
}
process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop());
try {
  await startBridge();
  next = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      mode === "dev" ? "dev" : "start",
      "--hostname",
      "127.0.0.1",
    ],
    { cwd: root, stdio: "inherit" },
  );
  next.on("error", (error) => {
    console.error(error.message);
    stop();
    process.exitCode = 1;
  });
  next.on("exit", (code) => {
    stop();
    process.exitCode = code || 0;
  });
} catch (error) {
  console.error(`LittleTec: ${error.message}`);
  stop();
  process.exitCode = 1;
}
