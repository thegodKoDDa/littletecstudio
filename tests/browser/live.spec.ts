import { test, expect } from "@playwright/test";
import { exampleProfile, keyboard } from "../../src/lib/profile";
import type { LiveEvent } from "../../src/lib/live";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('littletec-studio-auto-connect', 'off'));
});

test("eventos identificados giram o knob, teclas respondem e ambiguidades não inventam movimento", async ({
  page,
}) => {
  const queue: LiveEvent[] = [];
  let sequence = 0;
  let stops = 0;
  const device = exampleProfile();
  device.layers[0][16] = keyboard("D", ["Win"]);
  const push = (event: Omit<LiveEvent, "id" | "at" | "origin">) =>
    queue.push({
      ...event,
      id: ++sequence,
      at: Date.now(),
      origin: "configured-action",
    });
  await page.route("**/api/device", async (route) => {
    const command = route.request().postDataJSON();
    const status = {
      ready: true,
      devices: [{ kind: "consumer", usagePage: 12, usage: 1 }],
      client: command.client,
      cursor: sequence,
    };
    let body: unknown;
    if (command.operation === "read")
      body = {
        profile: device,
        revision: "read-1",
        liveAvailable: true,
      };
    else if (command.operation === "live_start") body = { live: status };
    else if (command.operation === "live_events") {
      await new Promise((resolve) => setTimeout(resolve, 70));
      body = {
        live: { ...status, cursor: sequence },
        events: queue.filter((e) => e.id > command.cursor),
      };
    } else if (command.operation === "live_stop") {
      stops++;
      body = { live: { ...status, ready: false } };
    } else body = {};
    await route
      .fulfill({ contentType: "application/json", body: JSON.stringify(body) })
      .catch(() => {});
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Conectar teclado", exact: true })
    .click();
  await expect(page.getByText("Seu LittleTec, em tempo real.")).toBeVisible();
  const turn = {
    kind: "media" as const,
    phase: "press" as const,
    action: { type: "media" as const, command: "volume_up" },
    targets: [
      { layer: 0, position: 14 },
      { layer: 1, position: 14 },
    ],
    confidence: "unique" as const,
  };
  push(turn);
  await expect(page.getByTestId("knob-dial-0")).toHaveAttribute(
    "data-angle",
    "18",
  );
  await page
    .getByRole("button", { name: "Mostrar atividade recente", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Limpar histórico", exact: true })
    .click();
  await expect(page.getByTestId("knob-dial-0")).toHaveAttribute(
    "data-angle",
    "18",
  );
  push({ ...turn, phase: "release" });
  push({
    ...turn,
    targets: [{ layer: 0, position: 12 }],
    action: { type: "media", command: "volume_down" },
  });
  await expect(page.getByTestId("knob-dial-0")).toHaveAttribute(
    "data-angle",
    "0",
  );
  const key = {
    kind: "keyboard" as const,
    phase: "press" as const,
    action: {
      type: "keyboard" as const,
      steps: [{ key: "C", modifiers: ["Ctrl" as const] }],
    },
    targets: [{ layer: 0, position: 0 }],
    confidence: "unique" as const,
  };
  push(key);
  await expect(
    page.getByRole("button", { name: "Tecla 01: Ctrl + C", exact: true }),
  ).toHaveClass(/live-pressed/);
  push({ ...key, phase: "release" });
  await expect(
    page.getByRole("button", { name: "Tecla 01: Ctrl + C", exact: true }),
  ).not.toHaveClass(/live-pressed/);
  push({
    kind: "keyboard",
    phase: "press",
    action: keyboard("D", ["Win"]),
    targets: [{ layer: 0, position: 16 }],
    confidence: "unique",
    momentary: true,
    observation: "release-context",
  });
  await expect(page.locator(".live-last")).toContainText("Giro 2 · Clique");
  await expect(
    page
      .getByRole("button", { name: "Giro 2: clique", exact: true })
      .locator(".input-flash"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Seguir entrada na seleção", exact: true })
    .click();
  await page.getByRole("button", { name: "Giratórios", exact: true }).click();
  push({
    kind: "keyboard",
    phase: "press",
    action: keyboard("F", ["Ctrl"]),
    targets: [{ layer: 0, position: 5 }],
    confidence: "unique",
  });
  await expect(page.locator(".live-last")).toContainText("Tecla 06");
  await expect(
    page.getByRole("heading", { name: "Giratório 2", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mapeamento", exact: true }).click();
  push({
    ...turn,
    confidence: "ambiguous",
    targets: [
      { layer: 0, position: 14 },
      { layer: 1, position: 17 },
    ],
  });
  await expect(page.locator(".live-panel")).toContainText(
    "2 origens possíveis",
  );
  await expect(page.getByTestId("knob-dial-0")).toHaveAttribute(
    "data-angle",
    "0",
  );
  await expect(page.getByTestId("knob-dial-1")).toHaveAttribute(
    "data-angle",
    "0",
  );
  await page
    .getByRole("button", { name: "Pausar entrada ao vivo", exact: true })
    .click();
  await expect(
    page.getByText("Monitor pausado", { exact: true }),
  ).toBeVisible();
  await expect.poll(() => stops).toBeGreaterThan(0);
});

test("configuração dedicada dos knobs: preset, inversão, cópia de camada e undo", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Giratórios", exact: true }).click();
  await page.getByLabel("Preset do knob 1", { exact: true }).selectOption("0");
  await expect(
    page.getByRole("button", {
      name: "Configurar knob 1: esquerda",
      exact: true,
    }),
  ).toHaveAttribute("title", "Volume −");
  await page
    .locator(".encoder-card")
    .first()
    .getByRole("button", { name: "Inverter", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Configurar knob 1: esquerda",
      exact: true,
    }),
  ).toHaveAttribute("title", "Volume +");
  await page.getByLabel("Copiar knob 1", { exact: true }).selectOption("1");
  await page.locator(".layer-tabs button").nth(1).click();
  await expect(
    page.getByRole("button", {
      name: "Configurar knob 1: esquerda",
      exact: true,
    }),
  ).toHaveAttribute("title", "Volume +");
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Configurar knob 1: esquerda",
      exact: true,
    }),
  ).toHaveAttribute("title", "Sem ação");
  await expect(
    page.getByRole("button", { name: "Aplicar mapeamento", exact: true }),
  ).toBeDisabled();
});
