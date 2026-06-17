import { defineConfig, devices } from '@playwright/test'

// E2E runs against the playground's production build served by `php artisan serve`,
// client-only (SSR disabled for speed/determinism — SSR is verified separately).
// Build the playground first: `pnpm --filter playground build`.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:8000',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'php artisan serve --host=127.0.0.1 --port=8000',
    cwd: './playground',
    url: 'http://127.0.0.1:8000',
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    env: { INERTIA_SSR_ENABLED: 'false' },
  },
})
