import { expect, test, type Page } from '@playwright/test';
import {
  adminPassword,
  apiLogin,
  createRecruiter,
  loginAdmin,
  loginRecruiter,
  newPassword,
  ok,
  rawLogin,
} from './support/katch';

// SW-19 — Alteração da própria palavra-passe (RF040, RF084).
async function change(page: Page, current: string, next: string) {
  await page.getByLabel('Palavra-passe atual').fill(current);
  await page.getByLabel('Nova palavra-passe', { exact: true }).fill(next);
  await page.getByLabel('Confirmar nova palavra-passe').fill(next);
  await page.getByRole('button', { name: 'Alterar palavra-passe' }).last().click();
}

test.describe('SW-19 Alteração da própria palavra-passe', () => {
  test('SW-19a o Recrutador altera a palavra-passe e entra com a nova; os erros são rejeitados', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw19' });
    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto('/conta');

    await change(page, `${recruiter.password}x`, newPassword());
    await expect(
      page.getByRole('alert').or(page.locator('[aria-invalid="true"]')).first(),
    ).toBeVisible();

    await change(page, recruiter.password, 'curta');
    await expect(page.getByLabel('Nova palavra-passe', { exact: true })).toHaveAttribute(
      'aria-invalid',
      'true',
    );

    const updated = newPassword();
    await change(page, recruiter.password, updated);
    await expect(page.getByText('Palavra-passe alterada.')).toBeVisible();
    expect(await rawLogin(recruiter.email, updated, 'web')).toBe(200);
    expect(await rawLogin(recruiter.email, recruiter.password, 'web')).toBeGreaterThanOrEqual(400);
  });

  test('SW-19b o Administrador altera a palavra-passe e entra com a nova', async ({ page }) => {
    const original = adminPassword();
    const updated = newPassword();
    await loginAdmin(page);
    await page.goto('/admin/conta');
    await change(page, original, updated);
    try {
      await expect(page.getByText('Palavra-passe alterada.')).toBeVisible();
      expect(await rawLogin('admin@katch.pt', updated, 'web')).toBe(200);
    } finally {
      // Repõe a palavra-passe do Administrador para os cenários seguintes.
      const admin = await apiLogin('admin@katch.pt', updated);
      await ok(
        await admin.api.put('/api/auth/password', {
          data: { currentPassword: updated, newPassword: original },
        }),
        'repor a palavra-passe do Administrador',
      );
    }
  });
});
