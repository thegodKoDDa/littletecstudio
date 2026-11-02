import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { build } from 'esbuild';
import { buildClient } from './build-client.mjs';
import { syncIcons } from './sync-icons.mjs';

function run(cmd, args, opts = {}) {
  const stdio = opts.stdio || ['ignore', 'inherit', 'inherit'];
  const res = spawnSync(cmd, args, { stdio, windowsHide: true, ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0 && !opts.allowFailure) {
    throw new Error(`Falha no comando: ${cmd} ${args.join(' ')} (código ${res.status})`);
  }
  return res;
}

export async function syncAll({ killRunning = true, smokeTest = true } = {}) {
  console.log('\n======================================================');
  console.log('🔄 INICIANDO SINCRONIZAÇÃO AUTOMÁTICA (WEB + DESKTOP)');
  console.log('======================================================\n');

  // 1. Fechar instâncias ativas no Windows para evitar bloqueios de arquivo e travas
  if (killRunning) {
    try {
      console.log('1/8 Encerrando instâncias antigas em execução…');
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/F', '/IM', 'LittleTec-Studio.exe', '/IM', 'LittleTec-Bridge.exe'], { stdio: 'ignore' });
      } else {
        spawnSync('cmd.exe', ['/c', 'taskkill /F /IM LittleTec-Studio.exe /IM LittleTec-Bridge.exe < nul'], { stdio: 'ignore' });
      }
    } catch {
      // Ignorar se não houver processos abertos
    }
  }

  // 2. Sincronizar todos os ícones com suporte DIB multi-resolução
  console.log('2/8 Sincronizando ícones oficiais (16–256px DIBs + PNG)…');
  await syncIcons();

  // 3. Gerar bundles de interface (Web portátil e Desktop compartilham a mesma base)
  console.log('3/8 Compilando interface unificada para Desktop e Web portátil…');
  await buildClient('build/desktop-ui');
  await buildClient('build/web-portable');

  // 4. Compilar scripts de ciclo de vida Electron
  console.log('4/8 Compilando Electron (main.cjs e preload.cjs)…');
  for (const entry of ['main', 'preload']) {
    await build({
      entryPoints: [`desktop/${entry}.ts`],
      bundle: true,
      platform: 'node',
      target: 'node22',
      format: 'cjs',
      external: ['electron'],
      outfile: `dist-electron/${entry}.cjs`,
    });
  }

  // 5. Empacotar recursos app.asar do Desktop
  console.log('5/8 Atualizando pacote app.asar do Desktop…');
  const staging = '/tmp/littletec-asar-staging';
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(staging, { recursive: true });
  cpSync('build/desktop-ui', path.join(staging, 'ui'), { recursive: true });
  cpSync('dist-electron', path.join(staging, 'dist-electron'), { recursive: true });
  cpSync('desktop/icon.png', path.join(staging, 'desktop/icon.png'));
  cpSync('LICENSE', path.join(staging, 'LICENSE'));
  cpSync('package.json', path.join(staging, 'package.json'));

  mkdirSync('release/win-unpacked/resources', { recursive: true });
  run('npx', ['asar', 'pack', staging, 'release/win-unpacked/resources/app.asar']);

  // Atualizar zip do desktop
  const desktopZip = path.resolve('release/LittleTec-Studio-0.4.0-win-x64.zip');
  run('zip', ['-q', desktopZip, 'resources/app.asar'], {
    cwd: 'release/win-unpacked',
  });

  // Atualizar zip da versão web
  console.log('6/8 Atualizando pacote zip da versão Web portátil…');
  const webZip = path.resolve('release/LittleTec-Studio-Web-0.4.0.zip');
  rmSync(webZip, { force: true });
  run('zip', ['-qr', webZip, '.'], {
    cwd: 'build/web-portable',
  });

  // 6. Recompilar o executável portátil Windows .NET Launcher
  console.log('7/8 Compilando launcher LittleTec-Studio.exe…');
  const python = process.env.LITTLETEC_PYTHON || (process.platform === 'win32'
    ? path.join('.venv-windows', 'Scripts', 'python.exe')
    : path.resolve('.venv-windows/Scripts/python.exe'));

  if (existsSync(python)) {
    run(python, ['-X', 'utf8', 'tools/build-launcher.py', '--payload', 'release/LittleTec-Studio-0.4.0-win-x64.zip']);
  }

  // 7. Atualizar checksums SHA-256
  console.log('8/8 Calculando hashes SHA-256…');
  const desktopArchive = 'LittleTec-Studio-0.4.0-win-x64.zip';
  const desktopLines = [desktopArchive, 'LittleTec-Studio.exe'].map(name => {
    const digest = createHash('sha256').update(readFileSync(path.join('release', name))).digest('hex');
    return `${digest}  ${name}`;
  }).join('\n') + '\n';
  writeFileSync('release/SHA256SUMS-desktop.txt', desktopLines);

  const webArchive = 'LittleTec-Studio-Web-0.4.0.zip';
  const webDigest = createHash('sha256').update(readFileSync(path.join('release', webArchive))).digest('hex');
  writeFileSync('release/SHA256SUMS-web.txt', `${webDigest}  ${webArchive}\n`);

  // Atualizar atalhos existentes no Desktop do Windows se aplicável
  try {
    const updateShortcutScript = `
      $ws = New-Object -ComObject WScript.Shell
      $exe = (Resolve-Path "LittleTec-Studio.exe").Path
      $desktopLnk = [System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'LittleTec Studio.lnk')
      if (Test-Path $desktopLnk) {
        $s = $ws.CreateShortcut($desktopLnk)
        $s.TargetPath = $exe
        $s.IconLocation = "$exe,0"
        $s.WorkingDirectory = (Split-Path $exe)
        $s.Save()
      }
    `;
    spawnSync('powershell.exe', ['-Command', updateShortcutScript], { stdio: 'ignore' });
  } catch {
    // Ignorar em ambientes sem powershell
  }

  // 8. Verificação de smoke
  if (smokeTest) {
    console.log('\n🔍 Executando verificação de integridade (smoke test)…');
    run('npx', ['electron', '.', '--smoke']);
  }

  console.log('\n======================================================');
  console.log('✅ SINCRONIZAÇÃO COMPLETA: WEB E DESKTOP ATUALIZADOS!');
  console.log('   • LittleTec-Studio.exe pronto e liberado na raiz');
  console.log('   • release/win-unpacked atualizado');
  console.log('   • release/LittleTec-Studio-0.4.0-win-x64.zip atualizado');
  console.log('   • release/LittleTec-Studio-Web-0.4.0.zip atualizado');
  console.log('   • Atalhos do Windows sincronizados');
  console.log('======================================================\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  syncAll().catch(err => {
    console.error('Erro na sincronização:', err);
    process.exit(1);
  });
}
