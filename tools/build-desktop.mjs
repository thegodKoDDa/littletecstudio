import { build } from 'esbuild';
import { buildClient } from './build-client.mjs';

await buildClient('build/desktop-ui');
for (const entry of ['main', 'preload']) {
  await build({
    entryPoints: [`desktop/${entry}.ts`], bundle: true,
    platform: 'node', target: 'node22', format: 'cjs',
    external: ['electron'], outfile: `dist-electron/${entry}.cjs`,
  });
}
