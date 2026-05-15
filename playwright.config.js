import { defineConfig, devices } from '@playwright/test';

// E2E configuration — spins up Vite dev server, runs Chromium headless.
// Not wired into `npm test` (that runs Vitest). To execute these:
//   npx playwright test
//
// CI integration is left to a follow-up; locally these are a manual gate.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
