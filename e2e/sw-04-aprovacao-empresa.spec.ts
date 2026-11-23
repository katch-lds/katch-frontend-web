import { expect, test } from '@playwright/test';
import { confirmDialog, createRecruiter, loginAdmin, loginUi } from './support/katch';

// SW-04 — Aprovação e recusa da Empresa (RF044, RF045, RF091 a RF094).
test.describe('SW-04 Aprovação e recusa da Empresa', () => {
  test('SW-04a o Administrador consulta os dados submetidos e aprova uma Empresa', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: false, prefix: 'sw04a' });
    await loginAdmin(page);
    await page.goto(`/admin/pendentes/${recruiter.companyId}`);
    await expect(page.getByText(recruiter.companyName)).toBeVisible();
    await expect(page.getByText('NIF')).toBeVisible();
    await page.getByRole('button', { name: 'Aprovar registo' }).click();
    await confirmDialog(page, 'Aprovar registo');

    await expect(page).toHaveURL(/\/admin\/pendentes$/);
    await expect(page.getByRole('status')).toContainText(recruiter.companyName);
    await expect(page.getByRole('row').filter({ hasText: recruiter.companyName })).toHaveCount(0);
  });

  test('SW-04b recusa com motivo; motivo de 9 caracteres rejeitado; o Recrutador corrige e volta a pendente', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: false, prefix: 'sw04b' });
    await loginAdmin(page);
    await page.goto('/admin/pendentes');
    await expect(
      page.getByRole('heading', { name: 'Empresas pendentes de aprovação' }),
    ).toBeVisible();
    await page.goto(`/admin/pendentes/${recruiter.companyId}`);
    await page.getByRole('button', { name: 'Recusar registo' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Motivo da recusa').fill('123456789');
    await dialog.getByRole('button', { name: 'Recusar registo' }).click();
    await expect(dialog.getByLabel('Motivo da recusa')).toHaveAttribute('aria-invalid', 'true');

    const reason = 'O NIF indicado não corresponde à Empresa.';
    await dialog.getByLabel('Motivo da recusa').fill(reason);
    await dialog.getByRole('button', { name: 'Recusar registo' }).click();
    await expect(dialog).toBeHidden();

    const recruiterPage = await page.context().browser()!.newPage();
    await loginUi(recruiterPage, recruiter.email, recruiter.password);
    await expect(recruiterPage).toHaveURL(/\/empresa\/estado$/);
    await expect(recruiterPage.getByText(reason)).toBeVisible();
    await expect(recruiterPage.getByText('Recusada').first()).toBeVisible();

    await expect(recruiterPage.getByRole('heading', { name: 'Corrigir os dados' })).toBeVisible();
    await recruiterPage.getByLabel('Morada').fill('Rua Corrigida, n.º 3');
    await recruiterPage.getByRole('button', { name: 'Submeter novamente' }).click();
    await expect(recruiterPage.getByText('Pendente').first()).toBeVisible();
    await recruiterPage.close();
  });
});
