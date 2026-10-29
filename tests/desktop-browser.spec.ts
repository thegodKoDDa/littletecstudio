import { test, expect, _electron as electron } from '@playwright/test';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

test('fechar pela janela encerra a ponte e permite reabrir com o mesmo perfil', async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), 'littletec-electron-close-'));
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const application = await electron.launch({
        args: ['.'], cwd: process.cwd(),
        env: { ...process.env, LITTLETEC_TEST_USER_DATA: profile },
      });
      const child = application.process();
      let stderr = '';
      child.stderr?.on('data', chunk => { stderr += chunk.toString(); });
      try {
        const page = await application.firstWindow();
        await expect(page.getByRole('button', { name: 'Mapeamento', exact: true })).toBeVisible();
        const exited = new Promise<number | null>(resolve => child.once('exit', resolve));
        // O botão X destrói BrowserWindow antes de window-all-closed/app.quit.
        await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close());
        expect(await exited).toBe(0);
        expect(stderr).not.toMatch(/Object has been destroyed|Uncaught Exception|UnhandledPromiseRejection/);
      } finally {
        if (child.exitCode === null) await application.close();
      }
    }
  } finally {
    await rm(profile, { recursive: true, force: true });
  }
});

test('Electron usa o Studio comum: edição, histórico, biblioteca, arquivo, IPC e isolamento', async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), 'littletec-electron-test-'));
  const application = await electron.launch({
    args: ['.'], cwd: process.cwd(),
    env: { ...process.env, LITTLETEC_TEST_USER_DATA: profile },
  });
  try {
    const page = await application.firstWindow();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.getByRole('button', { name: 'Tecla 02: Ctrl + V', exact: true }).click();
    await page.getByRole('button', { name: 'Copiar (Ctrl+C)', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Tecla 02: Ctrl + C', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Desfazer', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Tecla 02: Ctrl + V', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Refazer', exact: true }).click();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Tecla 02: Ctrl + C', exact: true })).toBeVisible();
    for (const name of ['Giratórios', 'Iluminação', 'Perfis']) {
      await page.getByRole('button', { name, exact: true }).click();
    }
    await page.getByRole('button', { name: 'Salvar na biblioteca', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Essenciais', exact: true })).toBeVisible();
    const downloaded = path.join(profile, 'profile.json');
    await application.evaluate(({ dialog }, destination) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: destination });
    }, downloaded);
    await page.getByRole('button', { name: 'Exportar JSON', exact: true }).click();
    await expect.poll(async () => {
      try { return JSON.parse(await readFile(downloaded, 'utf8')).name; }
      catch { return null; }
    }).toBe('Essenciais');
    await page.locator('input[type="file"]').first().setInputFiles(downloaded);
    const status = await page.evaluate(() => window.littleTecDesktop!.request({ operation: 'status' }));
    expect(status.body.bridge).toBe(true);
    expect(status.body.connected).toBe(false);
    expect(await page.evaluate(() => typeof (window as unknown as { require?: unknown }).require)).toBe('undefined');
    await page.screenshot({ path: '.runtime/desktop-smoke.png', fullPage: true });
    expect(errors).toEqual([]);
  } finally {
    await application.close();
    await rm(profile, { recursive: true, force: true });
  }
});
