import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;
const baseURL = process.env.BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./app",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 2 : undefined,
  // Both paths are resolved against this file, so artifacts stay inside e2e/ (and out of git)
  // wherever the runner is launched from — repo root on the host, /work in the container.
  outputDir: "./test-results",
  reporter: CI
    ? [["html", { open: "never", outputFolder: "./playwright-report" }], ["github"]]
    : "list",
  // Snapshot baselines are Docker-made (host fonts and antialiasing differ), so a host run
  // skips the visual assertions instead of writing a second, unusable set of baselines.
  ignoreSnapshots: !CI,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // Single desktop project: the app is a print workbench sized in mm, not a responsive site.
  // A phone project would only add a second set of snapshot baselines to maintain.
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev --host",
    url: baseURL,
    cwd: "..",
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
