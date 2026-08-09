import { defineConfig } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  reporter: [["list"]],
  testDir: "./tests/e2e",
  testIgnore: ["**/._*"],
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:4173/classroom-sgts-nh-tzk/",
    browserName: "chromium",
    channel: process.env.CI ? undefined : "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run serve",
    reuseExistingServer: !process.env.CI,
    stderr: "pipe",
    stdout: "pipe",
    timeout: 30_000,
    url: "http://127.0.0.1:4173/classroom-sgts-nh-tzk/"
  }
});
