import { defineConfig } from "@playwright/test";
const testPort = Number(process.env.LITTLETEC_TEST_PORT || "4317");
const testURL = `http://127.0.0.1:${testPort}`;

export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: testURL,
    viewport: { width: 1440, height: 1080 },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npm run dev:ui -- --port ${testPort}`,
    url: testURL,
    reuseExistingServer: false,
    timeout: 60000,
  },
});
