import { app, BrowserWindow, dialog, ipcMain, net, protocol, session } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { deviceCommandSchema } from '../src/lib/device-command';
import { DesktopBridge } from './bridge';

protocol.registerSchemesAsPrivileged([
  { scheme: 'littletec', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);
app.setName('LittleTec Studio');
// Rascunhos e biblioteca têm caminho estável, separado do Qt e do navegador.
app.setPath('userData', (!app.isPackaged && process.env.LITTLETEC_TEST_USER_DATA)
  || path.join(app.getPath('appData'), 'LittleTec Desktop'));

let window: BrowserWindow | null = null;
let bridge: DesktopBridge | null = null;
let quitting = false;
let stopping = false;
const origin = 'littletec://studio';
const smoke = process.argv.includes('--smoke');
const offline = smoke || process.argv.includes('--offline') || process.env.LITTLETEC_DISABLE_AUTO_CONNECT === '1';
const started = performance.now();
const startup: Record<string, number> = {};

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    if (stopping || !window || window.isDestroyed()) return;
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
  });
  app.on('before-quit', event => {
    if (quitting) return;
    event.preventDefault();
    if (stopping) return;
    stopping = true;
    if (window && !window.isDestroyed()) window.hide();
    void (async () => {
      await bridge?.close();
      quitting = true;
      app.quit();
    })();
  });
  app.on('window-all-closed', () => app.quit());

  void app.whenReady().then(async () => {
    const root = app.getAppPath();
    const staticRoot = app.isPackaged ? path.join(root, 'ui') : path.join(root, 'build', 'desktop-ui');
    protocol.handle('littletec', async request => {
      const url = new URL(request.url);
      if (url.host !== 'studio' || request.method !== 'GET') return new Response('', { status: 403 });
      let relative: string;
      try { relative = decodeURIComponent(url.pathname); }
      catch { return new Response('', { status: 400 }); }
      const filename = path.resolve(staticRoot, '.' + (relative === '/' ? '/index.html' : relative));
      if (!filename.startsWith(staticRoot + path.sep)) return new Response('', { status: 403 });
      try {
        const response = await net.fetch(pathToFileURL(filename).href);
        const headers = new Headers(response.headers);
        headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'");
        return new Response(response.body, { status: response.status, headers });
      } catch { return new Response('', { status: 404 }); }
    });

    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    session.defaultSession.on('will-download', (_event, item) => {
      item.setSaveDialogOptions({ defaultPath: path.join(app.getPath('documents'), path.basename(item.getFilename())) });
    });

    const python = process.env.LITTLETEC_PYTHON || (process.platform === 'win32'
      ? path.join(root, '.venv-windows', 'Scripts', 'python.exe') : 'python3');
    await mkdir(app.getPath('userData'), { recursive: true });
    const captures = path.join(app.getPath('userData'), 'captures');
    bridge = app.isPackaged
      ? new DesktopBridge(path.join(process.resourcesPath, 'bridge', 'LittleTec-Bridge.exe'), [], app.getPath('userData'), captures)
      : new DesktopBridge(python, ['-X', 'utf8', path.join(root, 'bridge', 'desktop.py')], root, captures);
    // A interface pode abrir enquanto o processo Python inicializa.
    void bridge.ready.then(() => { startup.bridgeReadyMs = Math.round(performance.now() - started); }, () => {});

    ipcMain.handle('device:request', async (event, command) => {
      if (event.sender !== window?.webContents || !event.senderFrame?.url.startsWith(origin + '/')) {
        throw new Error('Origem não autorizada.');
      }
      if (stopping) throw new Error('O aplicativo está encerrando.');
      if (JSON.stringify(command).length > 1_000_000) throw new Error('Comando muito grande.');
      return bridge!.request(deviceCommandSchema.parse(command));
    });

    ipcMain.handle('file:save-json', async (event, value, name) => {
      if (event.sender !== window?.webContents || !event.senderFrame?.url.startsWith(origin + '/')) {
        throw new Error('Origem não autorizada.');
      }
      if (stopping || typeof name !== 'string' || !name.endsWith('.json')) return false;
      const content = JSON.stringify(value, null, 2);
      if (!content || content.length > 5_000_000) return false;
      try {
        const result = await dialog.showSaveDialog(window!, {
          title: 'Exportar JSON',
          defaultPath: path.join(app.getPath('documents'), path.basename(name)),
          filters: [{ name: 'JSON', extensions: ['json'] }],
        });
        if (result.canceled || !result.filePath) return false;
        await writeFile(result.filePath, content, 'utf8');
        return true;
      } catch {
        dialog.showErrorBox('LittleTec Studio', 'Não foi possível salvar o arquivo. Confira a pasta e tente novamente.');
        return false;
      }
    });

    window = new BrowserWindow({
      width: 1440, height: 1000, minWidth: 900, minHeight: 650,
      title: 'LittleTec Studio', backgroundColor: '#111412', show: false,
      icon: path.join(root, 'desktop', 'icon.png'),
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        contextIsolation: true, nodeIntegration: false, sandbox: true,
        additionalArguments: offline ? ['--littletec-offline'] : [],
      },
    });
    window.setMenu(null);
    window.once('closed', () => { window = null; });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event, url) => {
      if (url !== origin + '/') event.preventDefault();
    });
    window.once('ready-to-show', () => {
      startup.firstPaintMs = Math.round(performance.now() - started);
      if (!smoke) window?.show();
    });
    await window.loadURL(origin + '/');
    startup.uiLoadedMs = Math.round(performance.now() - started);
    if (smoke) {
      let uiReady = false;
      for (let attempt = 0; attempt < 100 && !uiReady; attempt++) {
        uiReady = await window.webContents.executeJavaScript("document.documentElement.dataset.studioReady === 'true'");
        if (!uiReady) await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (!uiReady) throw new Error('A interface não inicializou no prazo.');
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = await window.webContents.executeJavaScript(`(async () => {
        const reply = await window.littleTecDesktop.request({operation: 'status'});
        return {title: document.title, bridge: reply.body.bridge, connected: reply.body.connected, text: document.body.innerText, node: typeof require,
          uiReady: document.documentElement.dataset.studioReady === 'true',
          logoLoaded: document.querySelector('.brand-mark img')?.naturalWidth > 0};
      })()`);
      if (!result.bridge || !result.uiReady || !result.logoLoaded || result.node !== 'undefined' || !result.text.includes('Mapeamento')) throw new Error('Smoke desktop incompleto.');
      if (process.env.LITTLETEC_SMOKE_REPORT) {
        const destination = process.env.LITTLETEC_SMOKE_REPORT;
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, JSON.stringify({ ...result, packaged: app.isPackaged, platform: process.platform, autoConnectDisabled: offline, startup }, null, 2));
        const screenshot = await window.webContents.capturePage();
        await writeFile(destination + '.png', screenshot.toPNG());
      }
      console.log('LittleTec: interface e ponte carregadas; Node isolado; nenhum pedido USB.');
      if (process.argv.includes('--smoke-close-window')) window.close();
      else app.quit();
    }
  }).catch(error => {
    if (!smoke) dialog.showErrorBox('LittleTec Studio', `Não foi possível abrir o aplicativo.\n${error.message}`);
    console.error(error.message);
    process.exitCode = 1;
    app.quit();
  });
}
