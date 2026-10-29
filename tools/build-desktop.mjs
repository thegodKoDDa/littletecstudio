import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  stdio: 'inherit', env: { ...process.env, STATIC_EXPORT: 'true', BASE_PATH: '' },
});
if (result.status !== 0) process.exit(result.status || 1);
for (const entry of ['main', 'preload']) {
  await build({
    entryPoints: [`desktop/${entry}.ts`], bundle: true,
    platform: 'node', target: 'node22', format: 'cjs',
    external: ['electron'], outfile: `dist-electron/${entry}.cjs`,
  });
}
