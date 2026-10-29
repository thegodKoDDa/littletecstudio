import { test, expect } from '@playwright/test';
import { exampleProfile, keyboard } from '../../src/lib/profile';

for (const saved of [false, true]) {
  test(`conecta automaticamente ${saved ? 'preservando o rascunho' : 'carregando o teclado'}, sem enviar alterações`, async ({ page }) => {
    const read = exampleProfile();
    read.layers[0][1] = keyboard('B', ['Ctrl']);
    const draft = exampleProfile();
    draft.layers[0][1] = keyboard('D', ['Ctrl']);
    if (saved) await page.addInitScript(profile => localStorage.setItem('littletec-web-draft-v1', JSON.stringify(profile)), draft);
    const operations: string[] = [];
    await page.route('**/api/device', async route => {
      const { operation } = route.request().postDataJSON();
      operations.push(operation);
      await route.fulfill({ json: operation === 'status'
        ? { bridge: true, usb_platform: true, busy: false }
        : { profile: read, revision: 'auto-read', liveAvailable: false, lastLighting: [null, null, null] } });
    });
    page.on('dialog', () => { throw new Error('Conexão automática não deve pedir para substituir o rascunho.'); });
    await page.goto('/');
    await expect(page.getByRole('button', { name: `Tecla 02: Ctrl + ${saved ? 'D' : 'B'}`, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ler teclado', exact: true }).first()).toBeEnabled();
    expect(operations).toEqual(['status', 'read']);
    expect(operations).not.toContain('apply');
    expect(operations).not.toContain('led');
  });
}

test('sem ponte a edição continua disponível e o botão manual funciona', async ({ page }) => {
  const operations: string[] = [];
  await page.route('**/api/device', async route => {
    operations.push(route.request().postDataJSON().operation);
    await route.fulfill({ status: 503, json: { error: 'Ponte indisponível.' } });
  });
  await page.goto('/');
  await expect.poll(() => operations.length).toBe(1);
  await page.getByRole('button', { name: 'Conectar teclado', exact: true }).first().click();
  await expect(page.getByRole('alert').filter({ hasText: 'Ponte indisponível.' })).toBeVisible();
  expect(operations).toEqual(['status', 'read']);
});

test('edição feita durante a leitura automática não é substituída', async ({ page }) => {
  let release: () => void = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  let started = false;
  const read = exampleProfile();
  read.layers[0][1] = keyboard('B', ['Ctrl']);
  await page.route('**/api/device', async route => {
    if (route.request().postDataJSON().operation === 'status') {
      await route.fulfill({ json: { bridge: true, usb_platform: true } });
    } else {
      started = true;
      await gate;
      await route.fulfill({ json: { profile: read, revision: 'delayed', liveAvailable: false } });
    }
  });
  await page.goto('/');
  await expect.poll(() => started).toBe(true);
  await page.getByRole('button', { name: 'Tecla 02: Ctrl + V', exact: true }).click();
  await page.getByRole('button', { name: 'Copiar (Ctrl+C)', exact: true }).click();
  release();
  await expect(page.getByRole('button', { name: 'Ler teclado', exact: true }).first()).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Tecla 02: Ctrl + C', exact: true })).toBeVisible();
});
