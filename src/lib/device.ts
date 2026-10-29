import type { Profile } from "./profile";
import type { LiveEvent, LiveStatus } from "./live";

export type DeviceResult = {
  bridge?: boolean;
  usb_platform?: boolean;
  busy?: boolean;
  message?: string;
  revision?: string;
  profile?: Profile;
  identity?: Record<string, unknown>;
  lastLighting?: unknown[];
  lighting?: { layer: number; mode: number; color: string };
  diagnostic?: unknown;
  journal?: string;
  backup?: unknown;
  liveAvailable?: boolean;
  live?: LiveStatus;
  events?: LiveEvent[];
};

export async function deviceRequest(
  operation: string,
  payload: Record<string, unknown> = {},
  signal?: AbortSignal,
): Promise<DeviceResult> {
  try {
    if (typeof window !== "undefined" && window.littleTecDesktop) {
      signal?.throwIfAborted();
      const reply = await window.littleTecDesktop.request({ operation, ...payload });
      signal?.throwIfAborted();
      if (reply.status !== 200) {
        throw new Error(typeof reply.body.error === "string" ? reply.body.error : "Não foi possível concluir a operação.");
      }
      return reply.body as DeviceResult;
    }
    const response = await fetch("/api/device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation, ...payload }),
      signal,
    });

    if (!response.ok) {
      let errorMessage = "Não foi possível concluir a operação.";
      try {
        const data = await response.json();
        if (data && typeof data.error === "string") {
          errorMessage = data.error;
        }
      } catch {
        if (response.status === 404) {
          errorMessage =
            "Ponte USB offline. No modo web estático, o LittleTec funciona como editor e simulador de perfis (com exportação e importação JSON). Para comunicação USB direta com o teclado físico, execute o projeto localmente com a ponte ativa.";
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    if (error instanceof Error) throw error;
    throw new Error("Comunicação com o dispositivo indisponível nesta sessão.");
  }
}
