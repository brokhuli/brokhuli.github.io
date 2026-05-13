/*
 * Playwright config for end-to-end smoke tests.
 *
 * The suite runs against `npm run preview` (the static `dist/` build) so it
 * exercises exactly what gets deployed. Spec: ADR-010, tech-stack.md.
 *
 * One project (Chromium desktop) is enough for the smoke suite; cross-browser
 * coverage is folded into Phase 8's manual + MCP-driven matrix.
 */

import { defineConfig, devices } from "@playwright/test";

const PORT = 4327;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx astro preview --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
