import { watch } from 'node:fs';
import path from 'node:path';
import { syncAll } from './sync-all.mjs';

let timeout = null;
let syncing = false;
let pending = false;

async function triggerSync(filename) {
  if (syncing) {
    pending = true;
    return;
  }
  syncing = true;
  try {
    console.log(`\n[Auto-Sync] Alteração detectada em: ${filename}`);
    await syncAll({ killRunning: false, smokeTest: false });
  } catch (err) {
    console.error('[Auto-Sync] Erro durante sincronização:', err);
  } finally {
    syncing = false;
    if (pending) {
      pending = false;
      triggerSync('múltiplas alterações');
    }
  }
}

function debounceChange(filename) {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => triggerSync(filename), 400);
}

const foldersToWatch = ['src', 'desktop', 'public'];
console.log('👀 Observador ativo para sincronização automática em tempo real:', foldersToWatch.join(', '));

for (const folder of foldersToWatch) {
  try {
    watch(folder, { recursive: true }, (_eventType, filename) => {
      if (!filename) return;
      if (filename.includes('.git') || filename.includes('node_modules')) return;
      debounceChange(path.join(folder, filename));
    });
  } catch (err) {
    console.warn(`Não foi possível observar a pasta ${folder}:`, err.message);
  }
}
