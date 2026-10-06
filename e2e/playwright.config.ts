import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;
const baseURL = process.env.BASE_URL ?? "http://localhost:5173";
const PHONE_SPECS = /\/(builder|home|play)\.[\w-]+\.spec\.ts$/;

export default defineConfig({
  testDir: "./app",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  // resolved against this file, so artifacts stay in e2e/ wherever the runner is launched from
  outputDir: "./test-results",
  reporter: CI
    ? [["html", { open: "never", outputFolder: "./playwright-report" }], ["github"]]
    : "list",
  // host fonts and antialiasing differ from the image's, so baselines are Docker-made only
  ignoreSnapshots: !CI,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // the catalog is a print workbench sized in mm; home, the builder and the play view live on a phone
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] }, testIgnore: PHONE_SPECS },
    {
      name: "phone",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
      testMatch: PHONE_SPECS,
    },
  ],
  webServer: {
    command: "pnpm dev --host",
    url: baseURL,
    cwd: "..",
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
