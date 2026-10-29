import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'desktop-browser.spec.ts',
  workers: 1,
  timeout: 30_000,
});
