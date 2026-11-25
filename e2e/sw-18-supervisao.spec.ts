import { expect, test } from '@playwright/test';
import { demo, demoPassword, loginAdmin, loginRecruiter } from './support/katch';

// SW-18 — Área de supervisão e conversas (RF103, RF104).
test.describe('SW-18 Área de supervisão e conversas', () => {
  test('SW-18a o Recrutador não acede às páginas do Administrador', async ({ page }) => {
    await loginRecruiter(page, demo.recruiter1, demoPassword());
    for (const path of [
      '/admin/indicadores',
      '/admin/contas',
      '/admin/empresas',
      '/admin/listas',
    ]) {
      await page.goto(path);
      await expect(page, `acesso direto a ${path}`).not.toHaveURL(new RegExp(`${path}$`));
    }
  });

  test('SW-18b o Administrador não tem acesso às conversas, nem por URL direto', async ({
    page,
  }) => {
    await loginAdmin(page);
    await expect(page.getByRole('link', { name: 'Conversas' })).toHaveCount(0);
    await page.goto('/conversas');
    await expect(page).not.toHaveURL(/\/conversas$/);
    await expect(page.getByRole('list', { name: 'Lista de conversas' })).toHaveCount(0);
  });
});
