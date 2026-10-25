import { defineConfig, devices } from '@playwright/test';

// End to end tests run against the full Docker stack (nginx, Django, Postgres).
// Locally that is http://localhost:8080. CI sets E2E_BASE_URL.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,

  // Fail the CI run if a test.only was left in by accident.
  forbidOnly: !!process.env.CI,

  // No retries: a flaky test must fail visibly, so repeatability is proven.
  retries: 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
