import { test, expect, _electron as electron } from '@playwright/test';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { exampleProfile, keyboard } from '../src/lib/profile';

test('Desktop conecta automaticamente usando a ponte, sem aplicar alterações', async () => {
  test.skip(process.platform === 'win32', 'O simulador usa shebang POSIX; nenhum acesso físico.');
  const folder = await mkdtemp(path.join(os.tmpdir(), 'littletec-auto-connect-'));
  const profile = exampleProfile();
  profile.layers[0][1] = keyboard('B', ['Ctrl']);
  const fixture = path.join(folder, 'profile.json');
  const journal = path.join(folder, 'operations.jsonl');
  const python = path.join(folder, 'python-simulated');
  await writeFile(fixture, JSON.stringify(profile));
  await writeFile(python, `#!/usr/bin/env python3
import json,sys,pathlib
profile=json.loads(pathlib.Path(${JSON.stringify(fixture)}).read_text())
print(json.dumps({'ready':True}),flush=True)
for line in sys.stdin:
 request=json.loads(line);op=request['command']['operation']
 with open(${JSON.stringify(journal)},'a') as log: log.write(json.dumps(op)+'\\n')
 body={'bridge':True,'usb_platform':True,'busy':False} if op=='status' else {'profile':profile,'revision':'simulated','liveAvailable':False}
 print(json.dumps({'id':request['id'],'status':200,'body':body}),flush=True)
`, { mode: 0o755 });
  const application = await electron.launch({
    args: ['.'], cwd: process.cwd(),
    env: { ...process.env, LITTLETEC_TEST_USER_DATA: path.join(folder, 'data'), LITTLETEC_PYTHON: python },
  });
  try {
    const page = await application.firstWindow();
    await expect(page.getByRole('button', { name: 'Tecla 02: Ctrl + B', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ler teclado', exact: true }).first()).toBeEnabled();
    expect((await readFile(journal, 'utf8')).trim().split('\n').map(value => JSON.parse(value))).toEqual(['status', 'read']);
  } finally {
    await application.close();
    await rm(folder, { recursive: true, force: true });
  }
});

test('a interface fica utilizável antes de a ponte terminar de iniciar', async ({}, testInfo) => {
  test.skip(process.platform === 'win32', 'O invólucro de Python deste teste usa shebang POSIX.');
  const profile = await mkdtemp(path.join(os.tmpdir(), 'littletec-bridge-startup-'));
  const gate = path.join(profile, 'continue');
  const python = path.join(profile, 'python-delayed');
  await writeFile(python, `#!/usr/bin/env python3
import pathlib,os,sys,time
started=time.monotonic()
while not pathlib.Path(${JSON.stringify(gate)}).exists():
 if time.monotonic()-started>15: sys.exit(2)
 time.sleep(0.02)
os.execvp('python3', ['python3', *sys.argv[1:]])
`, { mode: 0o755 });
  let application: Awaited<ReturnType<typeof electron.launch>> | undefined;
  let traced = false;
  let completed = false;
  try {
    application = await test.step('iniciar Electron com a ponte suspensa', () => electron.launch({
      args: ['.'], cwd: process.cwd(), timeout: 10_000,
      env: { ...process.env, LITTLETEC_TEST_USER_DATA: profile, LITTLETEC_DISABLE_AUTO_CONNECT: '1', LITTLETEC_PYTHON: python },
    }));
    await application.context().tracing.start({ screenshots: true, snapshots: true, sources: true });
    traced = true;
    const page = await application.firstWindow({ timeout: 10_000 });
    await test.step('editar a interface antes da prontidão da ponte', async () => {
      await expect(page.getByRole('button', { name: 'Mapeamento', exact: true })).toBeVisible({ timeout: 5_000 });
      await page.getByRole('button', { name: 'Perfis', exact: true }).click({ timeout: 5_000 });
      await expect(page.getByRole('heading', { name: 'Seu fluxo, sempre à mão.' })).toBeVisible({ timeout: 5_000 });
      await expect.poll(() => page.locator('.brand-mark img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBe(256);
    });
    await test.step('liberar a ponte e conferir o transporte', async () => {
      await writeFile(gate, 'ready');
      const status = await page.evaluate(() => window.littleTecDesktop!.request({ operation: 'status' }));
      expect(status.body.bridge).toBe(true);
    });
    completed = true;
  } finally {
    await writeFile(gate, 'ready');
    if (application) {
      if (traced) await application.context().tracing.stop(completed ? {} : { path: testInfo.outputPath('startup-trace.zip') });
      await application.close();
    }
    await rm(profile, { recursive: true, force: true });
  }
});

test('fechar pela janela encerra a ponte e permite reabrir com o mesmo perfil', async () => {
  const profile = await mkdtemp(path.join(os.tmpdir(), 'littletec-electron-close-'));
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const application = await electron.launch({
        args: ['.'], cwd: process.cwd(),
        env: { ...process.env, LITTLETEC_TEST_USER_DATA: profile, LITTLETEC_DISABLE_AUTO_CONNECT: "1" },
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
    env: { ...process.env, LITTLETEC_TEST_USER_DATA: profile, LITTLETEC_DISABLE_AUTO_CONNECT: "1" },
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
