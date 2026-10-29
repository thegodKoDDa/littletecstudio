import test from "node:test";
import assert from "node:assert/strict";
import { applyLiveEvents, emptyLive, type LiveEvent } from "../src/lib/live";

const event = (
  id: number,
  position: number,
  phase: LiveEvent["phase"] = "press",
): LiveEvent => ({
  id,
  at: 123,
  kind: "media",
  phase,
  action: { type: "media", command: "volume_up" },
  targets: [{ layer: 0, position }],
  confidence: "unique",
  origin: "configured-action",
});
test("giro só acompanha eventos reais identificados, com sentidos opostos", () => {
  let state = applyLiveEvents(emptyLive(), [event(1, 14)]);
  assert.equal(state.angles[0], 18);
  state = applyLiveEvents(state, [
    event(1, 14),
    event(2, 14, "release"),
    event(3, 12),
  ]);
  assert.equal(state.angles[0], 0);
  assert.equal(state.count, 2);
});
test("ação ambígua destaca candidatos sem inventar rotação", () => {
  const state = applyLiveEvents(emptyLive(), [
    {
      ...event(1, 14),
      confidence: "ambiguous",
      targets: [
        { layer: 0, position: 14 },
        { layer: 1, position: 17 },
      ],
    },
  ]);
  assert.deepEqual(state.angles, [0, 0, 0, 0]);
  assert.equal(state.pulses[14].ambiguous, true);
  assert.deepEqual(state.active,[]);
});
test("mouse momentâneo não fica preso e release remove tecla pressionada", () => {
  const state = applyLiveEvents(emptyLive(), [
    event(1, 0),
    event(2, 0, "release"),
    { ...event(3, 17), momentary: true, amount: 2 },
  ]);
  assert.deepEqual(state.active, []);
  assert.equal(state.angles[1], 36);
});
test("camadas repetidas da mesma posição contam um único movimento físico", () => {
  const state = applyLiveEvents(emptyLive(), [
    {
      ...event(1, 14),
      targets: [
        { layer: 0, position: 14 },
        { layer: 1, position: 14 },
        { layer: 2, position: 14 },
      ],
    },
  ]);
  assert.equal(state.angles[0], 18);
});
