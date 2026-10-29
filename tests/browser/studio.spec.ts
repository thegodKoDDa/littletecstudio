import { test, expect } from "@playwright/test";
import { newProfile } from "../../src/lib/profile";

test("edita, desfaz e preserva o rascunho ao recarregar", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Tecla 02: Ctrl + V", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tecla 02", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Copiar (Ctrl+C)", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Tecla 02: Ctrl + C", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Tecla 02: Ctrl + V", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Tecla 02: Ctrl + C", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("captura, presets e sequências funcionam sem USB", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Capturar do meu teclado" }).click();
  await page.keyboard.press("Control+KeyB");
  await expect(
    page.getByRole("button", { name: "Tecla 01: Ctrl + B", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Giro 1 · Esquerda", exact: true })
    .click();
  await page.getByLabel("Preset do giratório").selectOption("0");
  await expect(
    page.getByRole("button", { name: "Tecla 01: Ctrl + B", exact: true }),
  ).toBeVisible();
  await page.getByText("Digitar texto ou números", { exact: true }).click();
  await page
    .getByLabel("Sequência em posições US · até 20 etapas")
    .fill("1234");
  await page
    .getByRole("button", { name: "Atribuir sequência", exact: true })
    .click();
  await expect(page.getByText("SEQUÊNCIA · 4 ETAPAS")).toBeVisible();
});

test("navegação, iluminação, biblioteca e erro de ponte indisponível", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Iluminação", exact: true }).click();
  await page.getByRole("button", { name: "Ciano", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Aplicar nesta camada" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Perfis", exact: true }).click();
  await page
    .getByRole("button", { name: "Salvar neste navegador", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Essenciais", exact: true }),
  ).toBeVisible();
  await page.route("**/api/device", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Ponte local indisponível." }),
    }),
  );
  await page
    .getByRole("button", { name: "Conectar teclado", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Ponte local indisponível" }),
  ).toBeVisible();
});

test("integração simulada distingue leitura, mapeamento e iluminação", async ({
  page,
}) => {
  const operations: string[] = [];
  await page.route("**/api/device", async (route) => {
    const command = route.request().postDataJSON();
    operations.push(command.operation);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify(
        command.operation === "read"
          ? { profile: newProfile(), revision: "test-read" }
          : { message: "Envio simulado conferido.", revision: "test-next" },
      ),
    });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Conectar teclado", exact: true })
    .click();
  await expect(
    page.getByText("Teclado conectado", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Copiar (Ctrl+C)", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aplicar mapeamento", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Envio simulado conferido." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Iluminação", exact: true }).click();
  await page.getByRole("button", { name: "Azul", exact: true }).click();
  await page
    .getByRole("button", { name: "Aplicar nesta camada", exact: true })
    .click();
  await expect(page.getByText("Último envio: Azul · modo 1.")).toBeVisible();
  expect(operations).toEqual(["read", "apply", "led"]);
});

test("layout em desktop e celular sem transbordar horizontalmente", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1440, height: 1080 },
    { width: 1040, height: 800 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    for (const section of ["Mapeamento", "Giratórios", "Iluminação", "Perfis"]) {
      await page.getByRole("button", { name: section, exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  }
});

test("modelos de rascunho e tema persistem sem alegar suporte USB", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Alternar tema", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Perfis", exact: true }).click();
  await page
    .getByText("Modelos de rascunho e layout personalizado", { exact: true })
    .click();
  await page
    .getByLabel("Modelo de rascunho", { exact: true })
    .selectOption("3+1");
  await page
    .getByRole("button", { name: "Criar rascunho", exact: true })
    .click();
  await expect(
    page.getByText("3+1 · Modelo de rascunho, sem envio USB"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Aplicar mapeamento", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(
    page.getByText("3+1 · Modelo de rascunho, sem envio USB"),
  ).toBeVisible();
});

test("API real recusa outra origem, host externo e envio de bytes arbitrários", async ({
  request,
}) => {
  const otherOrigin = await request.post("/api/device", {
    headers: { Origin: "https://example.com" },
    data: { operation: "status" },
  });
  expect(otherOrigin.status()).toBe(403);
  const otherHost = await request.post("/api/device", {
    headers: { Host: "example.com:3000" },
    data: { operation: "status" },
  });
  expect(otherHost.status()).toBe(403);
  const raw = await request.post("/api/device", {
    data: { operation: "send", bytes: [3, 239] },
  });
  expect(raw.status()).toBe(400);
});
