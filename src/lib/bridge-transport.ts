import { spawn } from "node:child_process";
import { pythonRuntime } from "../../tools/python-runtime.mjs";

type Reply = { status: number; body: Record<string, unknown> };

export async function bridgeRequest(
  command: unknown,
  token: string,
): Promise<Reply> {
  const runtime = pythonRuntime();
  if (runtime.relay) {
    // WSL NAT: o relay roda no Windows e acessa o loopback Windows.
    // O transporte é escolhido ANTES do envio; nunca repetir uma gravação.
    return new Promise((resolve, reject) => {
      const child = spawn(
        runtime.executable,
        ["-X", "utf8", "bridge/relay.py"],
        {
          cwd: process.cwd(),
          windowsHide: true,
          stdio: ["pipe", "pipe", "pipe"],
        },
      );
      let output = "";
      let error = "";
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => {
        output += chunk;
      });
      child.stderr.on("data", (chunk) => {
        error = (error + chunk).slice(-4000);
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(error || "Falha no relay Windows."));
          return;
        }
        try {
          resolve(JSON.parse(output) as Reply);
        } catch {
          reject(new Error("Resposta inválida da ponte Windows."));
        }
      });
      child.stdin.on("error", reject);
      child.stdin.end(JSON.stringify({ command, token }));
    });
  }
  const response = await fetch("http://127.0.0.1:17643/command", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-LittleTec-Token": token },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  return { status: response.status, body: await response.json() };
}
