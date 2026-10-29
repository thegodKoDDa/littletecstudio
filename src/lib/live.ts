import type { Action } from "./profile";

export type LiveEvent = {
  id: number;
  at: number;
  kind: "keyboard" | "media" | "mouse" | "pointer" | "device";
  phase: "press" | "repeat" | "release" | "move" | "connect" | "disconnect";
  action?: Action;
  targets: { layer: number; position: number }[];
  confidence: "unique" | "ambiguous" | "unmapped";
  origin: string;
  amount?: number;
  momentary?: boolean;
  dx?: number;
  dy?: number;
  observation?: "release-context";
};
export type LiveStatus = {
  mappingAvailable?: boolean;
  ready: boolean;
  devices: { kind: string; usagePage: number; usage: number }[];
  cursor: number;
  client: string;
  error?: string | null;
  lost?: boolean;
  unsupportedReports?: number;
};
export type LiveView = {
  ready: boolean;
  error: string | null;
  deviceCount: number;
  disconnected: boolean;
  active: number[];
  pulses: Record<number, { id: number; ambiguous: boolean }>;
  angles: number[];
  events: LiveEvent[];
  count: number;
  lastId: number;
};
export const emptyLive = (): LiveView => ({
  ready: false,
  error: null,
  deviceCount: 0,
  disconnected: false,
  active: [],
  pulses: {},
  angles: [0, 0, 0, 0],
  events: [],
  count: 0,
  lastId: 0,
});

export function applyLiveEvents(
  previous: LiveView,
  events: LiveEvent[],
): LiveView {
  const next = {
    ...previous,
    active: [...previous.active],
    pulses: { ...previous.pulses },
    angles: [...previous.angles],
    events: [...previous.events],
  };
  const pressed = new Set(next.active);
  for (const event of events) {
    if (event.id <= next.lastId) continue;
    next.lastId = event.id;
    const positions = [...new Set(event.targets.map((t) => t.position))];
    if (event.phase === "release") {
      positions.forEach((p) => pressed.delete(p));
      continue;
    }
    if (event.kind === "device") {
      if (event.phase === "disconnect") pressed.clear();
      continue;
    }
    next.count += 1;
    next.events = [event, ...next.events].slice(0, 24);
    positions.forEach((p) => {
      next.pulses[p] = {
        id: event.id,
        ambiguous: event.confidence !== "unique",
      };
      if (!event.momentary && event.confidence === "unique") pressed.add(p);
    });
    // Só movimentar um giro quando a ação identifica uma única posição física.
    if (
      event.confidence === "unique" &&
      positions.length === 1 &&
      positions[0] >= 12 &&
      positions[0] < 18
    ) {
      const offset = positions[0] - 12;
      const direction = offset % 3;
      if (direction !== 1)
        next.angles[Math.floor(offset / 3)] +=
          (direction === 0 ? -1 : 1) * 18 * Math.min(20, event.amount ?? 1);
    }
  }
  next.active = [...pressed];
  return next;
}
