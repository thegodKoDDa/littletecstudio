import { build } from 'esbuild';
import { mkdir, rm, copyFile, writeFile } from 'node:fs/promises';
import { syncIcons } from './sync-icons.mjs';

/** Mesmos componentes e estilos para Desktop e editor portátil. */
export async function buildClient(output) {
  await syncIcons();
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await build({
    entryPoints: ['src/portable.tsx'], bundle: true, minify: true,
    format: 'iife', platform: 'browser', target: 'es2022', jsx: 'automatic',
    outfile: `${output}/studio.js`, assetNames: 'assets/[name]-[hash]',
    loader: { '.ttf': 'file', '.png': 'file' },
    define: { 'process.env.NODE_ENV': '"production"' },
  });
  await copyFile('desktop/icon.png', `${output}/icon.png`);
  await writeFile(`${output}/index.html`, '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LittleTec Studio — Seu espaço de controle</title><link rel="icon" type="image/png" href="./icon.png"><link rel="stylesheet" href="./studio.css"><script defer src="./studio.js"></script></head><body><div id="studio"></div></body></html>');
}
