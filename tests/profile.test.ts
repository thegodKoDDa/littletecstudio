import test from "node:test";
import assert from "node:assert/strict";
import {
  actionSchema,
  differences,
  exampleProfile,
  fromKeyEvent,
  keyboard,
  newProfile,
  parseProfile,
  textAction,
} from "../src/lib/profile";
import catalog from "../src/lib/catalog.json";

test("os 24 modelos mantêm dimensões e quantidades do desktop", () => {
  assert.equal(Object.keys(catalog.MODELS).length, 24);
  for (const [model, [keys, encoders, columns]] of Object.entries(
    catalog.MODELS,
  )) {
    const profile = parseProfile(newProfile(keys, encoders, columns, model));
    assert.equal(profile.layers[0].length, keys + encoders * 3);
  }
  assert.throws(() => parseProfile(newProfile(60, 4, 4, "inválido")));
});

test("perfil desktop v2 preserva ações opacas e iluminação desconhecida", () => {
  const profile = newProfile();
  profile.layers[1][14] = {
    type: "raw",
    data_hex: "fd110201" + "00".repeat(46),
  };
  profile.lighting[1] = { mode: null, color: null };
  assert.deepEqual(parseProfile(JSON.parse(JSON.stringify(profile))), profile);
});
test("rejeita modificadores repetidos, comandos herdados e campos inválidos", () => {
  assert.equal(
    actionSchema.safeParse(keyboard("C", ["Ctrl", "Ctrl"])).success,
    false,
  );
  assert.equal(
    actionSchema.safeParse({ type: "media", command: "__proto__" }).success,
    false,
  );
  assert.equal(
    actionSchema.safeParse({ type: "delay", ms: 6001 }).success,
    false,
  );
  assert.equal(
    actionSchema.safeParse({
      type: "keyboard",
      steps: [{ key: "", modifiers: [] }],
    }).success,
    false,
  );
});
test("captura código físico e modificadores, sem transformar modificador sozinho em tecla", () => {
  assert.deepEqual(
    fromKeyEvent({
      code: "KeyC",
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    }),
    keyboard("C", ["Ctrl"]),
  );
  assert.deepEqual(
    fromKeyEvent({
      code: "Numpad4",
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    }),
    keyboard("Num4"),
  );
  assert.equal(
    fromKeyEvent({
      code: "ControlLeft",
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    }),
    null,
  );
});
test("revisão separa alterações entre camadas e preserva origem", () => {
  const original = exampleProfile();
  const edited = structuredClone(original);
  edited.layers[2][17] = keyboard("F24");
  const changes = differences(original, edited);
  assert.equal(changes.length, 1);
  assert.equal(changes[0].position, 17);
  assert.equal(changes[0].layer, 2);
  assert.deepEqual(original.layers[2][17], { type: "none" });
});
test("texto respeita posições US e limite físico incluindo Enter", () => {
  assert.deepEqual(textAction("aA"), {
    type: "keyboard",
    steps: [
      { key: "A", modifiers: [] },
      { key: "A", modifiers: ["Shift"] },
    ],
  });
  assert.throws(() => textAction("a".repeat(20), true));
  assert.throws(() => textAction("ç"));
});
test("migra perfil v1 de 12 teclas sem perder ações", () => {
  const actions = Array.from({ length: 12 }, () => ({
    key: "A",
    modifiers: ["Ctrl"],
  }));
  const result = parseProfile({
    format: "littletec-profile",
    version: 1,
    key_count: 12,
    name: "Antigo",
    layers: [actions, actions, actions],
  });
  assert.equal(result.layers[0].length, 12);
  assert.equal(result.encoder_count, 0);
  assert.deepEqual(result.layers[0][0], keyboard("A", ["Ctrl"]));
});
