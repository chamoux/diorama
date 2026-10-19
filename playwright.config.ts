import { defineConfig, devices } from '@playwright/test'

// E2E runs against the playground's production build served by `php artisan serve`,
// client-only (SSR disabled for speed/determinism — SSR is verified separately).
// Build the playground first: `pnpm --filter playground build`.
// E2E_PORT overrides the port when 8000 is taken by another local app.
// E2E_CHANNEL=chrome runs against the installed Google Chrome instead of Playwright's Chromium.
const port = process.env.E2E_PORT ?? '8000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel: process.env.E2E_CHANNEL } }],
  webServer: {
    command: `php artisan serve --host=127.0.0.1 --port=${port}`,
    cwd: './playground',
    url: `http://127.0.0.1:${port}`,
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    env: { INERTIA_SSR_ENABLED: 'false' },
  },
})
