import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

test('editor portátil abre pelo arquivo e edita sem servidor', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('build/web-portable/index.html')).href);
  await page.getByRole('button', { name: 'Tecla 02: Ctrl + V', exact: true }).click();
  await page.getByRole('button', { name: 'Copiar (Ctrl+C)', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tecla 02: Ctrl + C', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tecla 02: Ctrl + V', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
