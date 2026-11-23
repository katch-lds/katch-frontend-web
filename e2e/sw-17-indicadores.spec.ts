import { expect, test } from '@playwright/test';
import { loginAdmin } from './support/katch';

// SW-17 — Painel de indicadores (RF096).
const iso = (date: Date) => date.toISOString().slice(0, 10);

test.describe('SW-17 Painel de indicadores', () => {
  test('SW-17a apresenta os indicadores do período escolhido e rejeita a data inicial posterior à final', async ({
    page,
  }) => {
    await loginAdmin(page);
    await expect(page.getByRole('heading', { name: 'Painel de indicadores' })).toBeVisible();

    const today = new Date();
    const start = new Date(today.getTime() - 60 * 24 * 3600 * 1000);
    await page.getByLabel('Data inicial').fill(iso(start));
    await page.getByLabel('Data final').fill(iso(today));
    const response = page.waitForResponse((r) => r.url().includes('/api/admin/indicators'));
    await page.getByRole('button', { name: 'Aplicar período' }).click();
    expect((await response).status()).toBe(200);
    for (const label of [
      'Candidatos com conta ativa',
      'Empresas aprovadas',
      'Matches confirmados',
      'Conversas iniciadas',
    ]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }

    let requested = false;
    page.on('request', (r) => {
      if (r.url().includes('/api/admin/indicators')) {
        requested = true;
      }
    });
    await page.getByLabel('Data inicial').fill(iso(today));
    await page.getByLabel('Data final').fill(iso(start));
    await page.getByRole('button', { name: 'Aplicar período' }).click();
    await expect(
      page.getByRole('alert').or(page.locator('[aria-invalid="true"]')).first(),
    ).toBeVisible();
    expect(requested).toBeFalsy();
  });
});
