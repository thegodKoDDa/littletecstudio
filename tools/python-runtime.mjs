import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

export function pythonRuntime({
  root = process.cwd(),
  platform = process.platform,
  kernel = os.release(),
  exists = existsSync,
} = {}) {
  const bundled = path.resolve(
    root,
    "../novo/.venv-qt-windows/Scripts/python.exe",
  );
  const wsl = platform === "linux" && /microsoft/i.test(kernel);
  if ((platform === "win32" || wsl) && exists(bundled))
    return { executable: bundled, relay: wsl, usb: true };
  return {
    executable: platform === "win32" ? "python" : "python3",
    relay: false,
    usb: platform === "win32",
  };
}
