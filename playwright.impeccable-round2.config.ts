import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/impeccable",
  timeout: 120_000,
  expect: {
    timeout: 15_000
  },
  fullyParallel: false,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/impeccable-round-2", open: "never" }]
  ],
  use: {
    baseURL: process.env.WEB_URL || process.env.APP_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 }
      }
    }
  ],
  outputDir: "test-results/impeccable-round-2"
});
