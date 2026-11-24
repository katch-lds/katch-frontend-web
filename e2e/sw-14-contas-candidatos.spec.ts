import { expect, test } from '@playwright/test';
import {
  adminApi,
  apiLogin,
  confirmDialog,
  createRecruiter,
  demo,
  demoPassword,
  findRow,
  loginAdmin,
  rawLogin,
} from './support/katch';

// SW-14 — Contas e Candidatos (Administrador) (RF085 a RF090).
test.describe('SW-14 Contas e Candidatos (Administrador)', () => {
  test('SW-14a bloqueia e reativa uma conta', async ({ page }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw14' });
    await loginAdmin(page);
    await page.goto('/admin/contas');
    await expect(page.getByRole('heading', { name: 'Contas de utilizador' })).toBeVisible();
    await page.getByLabel('Pesquisar por correio eletrónico').fill(recruiter.email);
    const line = await findRow(page, recruiter.email);
    await line.getByRole('button', { name: 'Bloquear' }).click();
    await confirmDialog(page, 'Bloquear');
    await expect(await findRow(page, recruiter.email)).toContainText('Bloqueada');
    expect(await rawLogin(recruiter.email, recruiter.password, 'web')).toEqual({
      status: 403,
      code: 'ERR-03',
    });

    await (await findRow(page, recruiter.email)).getByRole('button', { name: 'Reativar' }).click();
    await confirmDialog(page, 'Reativar');
    await expect(await findRow(page, recruiter.email)).toContainText('Ativa');
    expect((await rawLogin(recruiter.email, recruiter.password, 'web')).status).toBe(200);
  });

  test('SW-14b suspende e reativa um Candidato; o suspenso não inicia sessão por pedido direto', async ({
    page,
  }) => {
    const email = demo.candidate(17);
    const candidate = await apiLogin(email, demoPassword(), 'mobile');
    await loginAdmin(page);
    await page.goto('/admin/candidatos');
    await expect(page.getByRole('heading', { name: 'Candidatos' })).toBeVisible();

    try {
      await (await findRow(page, email)).getByRole('button', { name: 'Suspender' }).click();
      await confirmDialog(page, 'Suspender');
      await expect(await findRow(page, email)).toContainText('Suspensa');
      expect(await rawLogin(email, demoPassword(), 'mobile')).toEqual({
        status: 403,
        code: 'ERR-04',
      });

      await (await findRow(page, email)).getByRole('button', { name: 'Reativar' }).click();
      await confirmDialog(page, 'Reativar');
      await expect(await findRow(page, email)).toContainText('Ativa');
      expect((await rawLogin(email, demoPassword(), 'mobile')).status).toBe(200);
    } finally {
      // Repõe a conta, se o teste falhar com o Candidato suspenso (a reativação de uma conta ativa é ignorada).
      const admin = await adminApi();
      await admin.api.post(`/api/admin/accounts/${candidate.userId}/reactivate`);
    }
  });
});
