import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/impeccable",
  timeout: 150_000,
  expect: {
    timeout: 15_000
  },
  fullyParallel: false,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/impeccable-round-3", open: "never" }]
  ],
  use: {
    baseURL: process.env.WEB_URL || process.env.APP_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium-responsive-accessibility",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1024, height: 768 }
      }
    }
  ],
  outputDir: "test-results/impeccable-round-3"
});
