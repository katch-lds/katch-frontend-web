import { defineConfig, devices } from '@playwright/test';

/**
 * I079 — testes de sistema do frontend web (QG-06; plano de testes do frontend web, secções 5, 7 e 12).
 *
 * O frontend é construído com VITE_API_BASE_URL a apontar para a API local e servido com `vite preview` (porto 4173),
 * sem o proxy de desenvolvimento; a API aceita esta origem pelo CORS (I130). Os cenários SW-01 a SW-21 correm por
 * ordem, num só worker, porque partilham a base de dados de demonstração.
 *
 * @returns A configuração do Playwright.
 */
const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:5180';
const webPort = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: `http://localhost:${webPort}`,
    locale: 'pt-PT',
    timezoneId: 'Europe/Lisbon',
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${webPort} --strictPort`,
    url: `http://localhost:${webPort}`,
    env: { VITE_API_BASE_URL: apiUrl },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
