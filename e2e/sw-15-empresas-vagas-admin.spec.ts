import { expect, test } from '@playwright/test';
import {
  apiLogin,
  confirmDialog,
  createJob,
  createRecruiter,
  findRow,
  loginAdmin,
} from './support/katch';

// SW-15 — Empresas e vagas (Administrador) (RF095, RF097, RF098, RF116).
test.describe('SW-15 Empresas e vagas (Administrador)', () => {
  test('SW-15a suspende e reativa uma Empresa aprovada e consulta as listas globais', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw15' });
    const job = await createJob(await apiLogin(recruiter.email, recruiter.password));

    await loginAdmin(page);
    await page.goto('/admin/vagas');
    await expect(page.getByRole('heading', { name: 'Vagas publicadas' })).toBeVisible();
    await expect(await findRow(page, job.title)).toContainText(recruiter.companyName);

    await page.goto('/admin/empresas');
    await expect(page.getByRole('heading', { name: 'Empresas' })).toBeVisible();
    await expect(
      page.getByText('Nortecode Soluções Digitais, Lda.').or(page.getByRole('row')).first(),
    ).toBeVisible();

    await (
      await findRow(page, recruiter.companyName)
    )
      .getByRole('button', { name: 'Suspender' })
      .click();
    await confirmDialog(page, 'Suspender');
    await expect(await findRow(page, recruiter.companyName)).toContainText('Suspensa');
    await (
      await findRow(page, recruiter.companyName)
    )
      .getByRole('button', { name: 'Reativar' })
      .click();
    await confirmDialog(page, 'Reativar');
    await expect(await findRow(page, recruiter.companyName)).toContainText('Aprovada');
  });
});
