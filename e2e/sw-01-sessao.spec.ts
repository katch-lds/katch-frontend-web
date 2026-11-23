import { expect, test } from '@playwright/test';
import {
  adminApi,
  createRecruiter,
  demo,
  demoPassword,
  loginAdmin,
  loginUi,
  ok,
} from './support/katch';

// SW-01 — Início e fim de sessão (RF038, RF083, RF106, RF107).
test.describe('SW-01 Início e fim de sessão', () => {
  test('SW-01a o Recrutador entra na área da Empresa e o Administrador na supervisão', async ({
    page,
  }) => {
    await loginUi(page, demo.recruiter1, demoPassword());
    await expect(page).toHaveURL(/\/vagas$/);
    await expect(page.getByRole('heading', { name: 'Vagas', level: 1 })).toBeVisible();

    await page.getByRole('button', { name: 'Terminar sessão' }).click();
    await expect(page).toHaveURL(/\/entrar$/);
    await loginAdmin(page);
    await expect(page.getByRole('heading', { name: 'Painel de indicadores' })).toBeVisible();
  });

  test('SW-01b palavra-passe errada mostra o motivo uniforme e não entra', async ({ page }) => {
    await loginUi(page, demo.recruiter1, `${demoPassword()}x`);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/entrar$/);

    await loginUi(page, 'inexistente@teste.katch.pt', `${demoPassword()}x`);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test('SW-01c conta bloqueada mostra o motivo e não entra', async ({ page }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw01' });
    const admin = await adminApi();
    await ok(
      await admin.api.post(`/api/admin/accounts/${recruiter.userId}/block`),
      'bloquear conta',
    );

    await loginUi(page, recruiter.email, recruiter.password);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test('SW-01d terminar sessão volta ao início de sessão e impede o regresso', async ({ page }) => {
    await loginUi(page, demo.recruiter1, demoPassword());
    await expect(page).toHaveURL(/\/vagas$/);
    await page.getByRole('button', { name: 'Terminar sessão' }).click();
    await expect(page).toHaveURL(/\/entrar$/);

    await page.goto('/vagas');
    await expect(page).toHaveURL(/\/entrar$/);
    await page.goto('/admin/indicadores');
    await expect(page).toHaveURL(/\/admin\/entrar$/);
  });
});
