import { z } from "zod";
import catalog from "./catalog.json";

export const modifierSchema = z.enum([
  "Ctrl",
  "Shift",
  "Alt",
  "Win",
  "RightCtrl",
  "RightShift",
  "RightAlt",
  "RightWin",
]);
const modifiers = z
  .array(modifierSchema)
  .refine((v) => new Set(v).size === v.length)
  .transform((v) => modifierSchema.options.filter((m) => v.includes(m)));
const stepSchema = z
  .object({
    key: z.string().refine((v) => v === "" || catalog.KEYS.includes(v)),
    modifiers,
  })
  .refine((v) => v.key !== "" || v.modifiers.length > 0, "Etapa vazia.");
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({
    type: z.literal("keyboard"),
    steps: z.array(stepSchema).min(1).max(256),
  }),
  z.object({
    type: z.literal("media"),
    command: z.string().refine((v) => Object.hasOwn(catalog.MEDIA, v)),
  }),
  z.object({
    type: z.literal("mouse"),
    command: z.string().refine((v) => Object.hasOwn(catalog.MOUSE, v)),
    modifiers: modifiers.refine((v) =>
      v.every((m) => ["Ctrl", "Shift", "Alt"].includes(m)),
    ),
  }),
  z.object({ type: z.literal("delay"), ms: z.number().int().min(0).max(6000) }),
  z.object({
    type: z.literal("raw"),
    data_hex: z
      .string()
      .regex(/^[a-fA-F0-9]{100}$/)
      .transform((v) => v.toLowerCase()),
  }),
]);
export type Action = z.infer<typeof actionSchema>;
export type Modifier = z.infer<typeof modifierSchema>;
export type Color = keyof typeof catalog.COLORS;
const colorSchema = z.enum(Object.keys(catalog.COLORS) as [Color, ...Color[]]);
export const lightingSchema = z.union([
  z.object({ mode: z.number().int().min(0).max(5), color: colorSchema }),
  z.object({ mode: z.null(), color: z.null() }),
]);
export const profileSchema = z
  .object({
    format: z.literal("littletec-profile"),
    version: z.literal(2),
    name: z.string().trim().min(1).max(100),
    model: z.string().min(1).max(100),
    key_count: z.number().int().min(0).max(60),
    encoder_count: z.number().int().min(0).max(4),
    columns: z.number().int().min(1).max(10),
    layers: z.array(z.array(actionSchema)).length(3),
    lighting: z.array(lightingSchema).length(3),
  })
  .refine(
    (p) =>
      p.key_count + p.encoder_count * 3 >= 1 &&
      p.key_count + p.encoder_count * 3 <= 60 &&
      p.layers.every(
        (layer) => layer.length === p.key_count + p.encoder_count * 3,
      ),
    "Quantidade de posições inconsistente.",
  );
export type Profile = z.infer<typeof profileSchema>;
export const keyboard = (key: string, modifiers: Modifier[] = []): Action => ({
  type: "keyboard",
  steps: [{ key, modifiers }],
});
export function newProfile(
  keys = 12,
  encoders = 2,
  columns = 4,
  model = "12+2",
): Profile {
  if (
    !Number.isInteger(keys) ||
    keys < 0 ||
    keys > 60 ||
    !Number.isInteger(encoders) ||
    encoders < 0 ||
    encoders > 4 ||
    keys + encoders * 3 < 1 ||
    keys + encoders * 3 > 60 ||
    !Number.isInteger(columns) ||
    columns < 1 ||
    columns > 10
  )
    throw new Error("Dimensões de perfil inválidas.");
  return {
    format: "littletec-profile",
    version: 2,
    name: "Meu espaço",
    model,
    key_count: keys,
    encoder_count: encoders,
    columns,
    layers: Array.from({ length: 3 }, () =>
      Array.from(
        { length: keys + encoders * 3 },
        (): Action => ({ type: "none" }),
      ),
    ),
    lighting: Array.from({ length: 3 }, () => ({
      mode: 1,
      color: "green" as const,
    })),
  };
}
export function exampleProfile(): Profile {
  const p = newProfile();
  p.name = "Essenciais";
  p.layers[0] = [
    keyboard("C", ["Ctrl"]),
    keyboard("V", ["Ctrl"]),
    keyboard("X", ["Ctrl"]),
    keyboard("Z", ["Ctrl"]),
    keyboard("S", ["Ctrl"]),
    keyboard("F", ["Ctrl"]),
    keyboard("Tab", ["Alt"]),
    keyboard("S", ["Win", "Shift"]),
    { type: "media", command: "previous" },
    { type: "media", command: "play_pause" },
    { type: "media", command: "next" },
    { type: "media", command: "mute" },
    { type: "media", command: "volume_down" },
    { type: "media", command: "mute" },
    { type: "media", command: "volume_up" },
    keyboard("Left"),
    keyboard("Space"),
    keyboard("Right"),
  ];
  return profileSchema.parse(p);
}
export function label(action: Action): string {
  switch (action.type) {
    case "none":
      return "Sem ação";
    case "raw":
      return "Ação preservada";
    case "delay":
      return `${action.ms} ms`;
    case "media":
      return (catalog.MEDIA as Record<string, string>)[action.command];
    case "mouse":
      return [
        ...action.modifiers,
        (catalog.MOUSE as Record<string, string>)[action.command],
      ].join(" + ");
    case "keyboard":
      return action.steps
        .map((s) =>
          [
            ...s.modifiers,
            (catalog.KEY_LABELS as Record<string, string>)[s.key] || s.key,
          ]
            .filter(Boolean)
            .join(" + "),
        )
        .join(" → ");
  }
}
export function positionLabel(index: number, keys = 12): string {
  return index < keys
    ? `Tecla ${String(index + 1).padStart(2, "0")}`
    : `Giro ${Math.floor((index - keys) / 3) + 1} · ${["Esquerda", "Clique", "Direita"][(index - keys) % 3]}`;
}
export function differences(a: Profile, b: Profile) {
  return b.layers.flatMap((layer, l) =>
    layer.flatMap((action, p) =>
      JSON.stringify(action) === JSON.stringify(a.layers[l][p])
        ? []
        : [
            {
              layer: l,
              position: p,
              before: a.layers[l][p] || ({ type: "none" } as Action),
              after: action,
            },
          ],
    ),
  );
}
export function parseProfile(input: unknown): Profile {
  // Mesma migração do desktop: perfis v1 não declaram giratórios.
  if (
    typeof input === "object" &&
    input !== null &&
    "version" in input &&
    input.version === 1
  ) {
    const legacy = z
      .object({
        format: z.literal("littletec-profile"),
        version: z.literal(1),
        name: z.string().min(1).max(100),
        key_count: z.number().int().min(1).max(60),
        layers: z
          .array(
            z.array(
              z.object({
                key: z.string(),
                modifiers: modifiers.refine((v) =>
                  v.every((m) => ["Ctrl", "Alt", "Shift", "Win"].includes(m)),
                ),
              }),
            ),
          )
          .length(3),
      })
      .parse(input);
    const result = newProfile(
      legacy.key_count,
      0,
      Math.min(legacy.key_count, 6),
      "personalizado",
    );
    result.name = legacy.name;
    result.layers = legacy.layers.map((layer) => {
      if (layer.length !== legacy.key_count)
        throw new Error("Quantidade de ações inválida.");
      const actions: Action[] = layer.map((s) =>
        !s.key && !s.modifiers.length
          ? { type: "none" }
          : keyboard(s.key, s.modifiers),
      );
      return actions;
    });
    return profileSchema.parse(result);
  }
  return profileSchema.parse(input);
}
export function textAction(text: string, enter = false): Action {
  if (!text || text.length + (enter ? 1 : 0) > 20)
    throw new Error("Use de 1 a 20 caracteres, incluindo Enter.");
  const steps = Array.from(text).map((char) => {
    const mapped = (
      catalog.TEXT_CHAR_MAP as unknown as Record<string, [string, string[]]>
    )[char];
    if (!mapped)
      throw new Error(
        `O caractere “${char}” não tem uma posição US conhecida.`,
      );
    return { key: mapped[0], modifiers: mapped[1] as Modifier[] };
  });
  if (enter) steps.push({ key: "Enter", modifiers: [] });
  return { type: "keyboard", steps };
}
export function download(value: unknown, name: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function fromKeyEvent(
  e: Pick<
    KeyboardEvent,
    "code" | "ctrlKey" | "shiftKey" | "altKey" | "metaKey"
  >,
): Action | null {
  const media: Record<string, string> = {
    AudioVolumeUp: "volume_up",
    AudioVolumeDown: "volume_down",
    AudioVolumeMute: "mute",
    MediaPlayPause: "play_pause",
    MediaStop: "stop",
    MediaTrackNext: "next",
    MediaTrackPrevious: "previous",
    LaunchMail: "email",
    LaunchApp1: "computer",
    LaunchApp2: "calculator",
    BrowserHome: "browser_home",
    BrowserBack: "browser_back",
    BrowserForward: "browser_forward",
    BrowserRefresh: "browser_refresh",
  };
  if (media[e.code]) return { type: "media", command: media[e.code] };
  const aliases: Record<string, string> = {
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Backquote: "Grave",
    ContextMenu: "Menu",
    NumpadAdd: "NumAdd",
    NumpadSubtract: "NumSubtract",
    NumpadMultiply: "NumMultiply",
    NumpadDivide: "NumDivide",
    NumpadDecimal: "NumDecimal",
    NumpadEnter: "NumEnter",
  };
  const key =
    aliases[e.code] ||
    e.code
      .replace(/^Key/, "")
      .replace(/^Digit/, "")
      .replace(/^Numpad/, "Num");
  if (!catalog.KEYS.includes(key)) return null;
  const mods: Modifier[] = [];
  if (e.ctrlKey) mods.push("Ctrl");
  if (e.shiftKey) mods.push("Shift");
  if (e.altKey) mods.push("Alt");
  if (e.metaKey) mods.push("Win");
  return keyboard(key, mods);
}
