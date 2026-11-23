import { expect, test } from '@playwright/test';
import {
  connectionFailureText,
  demo,
  demoPassword,
  loginAdmin,
  loginRecruiter,
} from './support/katch';

// SW-21 — Falha de ligação indicada em 10 segundos, no máximo (RNF018).
test.describe('SW-21 Falha de ligação', () => {
  test('SW-21a com os pedidos interrompidos, a página indica a falha de ligação', async ({
    page,
  }) => {
    await loginRecruiter(page, demo.recruiter1, demoPassword());
    await page.route('**/api/**', (route) => route.abort('connectionfailed'));
    const start = Date.now();
    await page.goto('/matches');
    await expect(page.getByText(connectionFailureText).first()).toBeVisible({ timeout: 10_000 });
    expect(Date.now() - start).toBeLessThanOrEqual(10_000);
  });

  test('SW-21b com o servidor sem resposta, a falha é indicada antes de 10 segundos', async ({
    page,
  }) => {
    await loginAdmin(page);
    // Os pedidos ficam sem resposta: o tempo limite do HttpApiClient (9 s) tem de disparar.
    await page.route('**/api/**', () => undefined);
    const start = Date.now();
    await page.goto('/admin/contas');
    await expect(page.getByText(connectionFailureText).first()).toBeVisible({ timeout: 10_000 });
    expect(Date.now() - start).toBeLessThanOrEqual(10_000);
  });

  test('SW-21c sem ligação no início de sessão, o formulário indica a falha', async ({ page }) => {
    await page.route('**/api/**', (route) => route.abort('connectionfailed'));
    await page.goto('/entrar');
    await page.getByLabel('E-mail', { exact: true }).fill(demo.recruiter1);
    await page.getByLabel('Palavra-passe', { exact: true }).fill(demoPassword());
    const start = Date.now();
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByText(connectionFailureText).first()).toBeVisible({ timeout: 10_000 });
    expect(Date.now() - start).toBeLessThanOrEqual(10_000);
  });
});
