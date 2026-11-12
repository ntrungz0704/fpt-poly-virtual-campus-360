import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium, defineConfig } from "@playwright/test";

function resolveBrowserExecutable(): string | undefined {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }

  const defaultPath = chromium.executablePath();
  if (defaultPath && fs.existsSync(defaultPath)) {
    return undefined;
  }

  const localAppData =
    process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  const msPlaywrightDir = path.join(localAppData, "ms-playwright");

  if (fs.existsSync(msPlaywrightDir)) {
    const entries = fs.readdirSync(msPlaywrightDir).sort().reverse();
    for (const entry of entries) {
      if (entry.startsWith("chromium-")) {
        const candidate = path.join(msPlaywrightDir, entry, "chrome-win64", "chrome.exe");
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
      if (entry.startsWith("chromium_headless_shell-")) {
        const candidate = path.join(
          msPlaywrightDir,
          entry,
          "chrome-headless-shell-win64",
          "chrome-headless-shell.exe",
        );
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    }
  }

  const systemChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  if (fs.existsSync(systemChrome)) {
    return systemChrome;
  }

  return undefined;
}

const executablePath = resolveBrowserExecutable();

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "retain-on-failure",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
});
