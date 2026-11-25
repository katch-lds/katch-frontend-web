import { expect, test } from '@playwright/test';
import { createRecruiter, loginUi } from './support/katch';

// SW-03 — Empresa não aprovada sem operações reservadas (RF039).
test.describe('SW-03 Empresa não aprovada sem operações reservadas', () => {
  test('SW-03a o Recrutador de Empresa pendente vê o aviso e não acede às áreas reservadas, nem por URL', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: false, prefix: 'sw03' });
    await loginUi(page, recruiter.email, recruiter.password);
    await expect(page).toHaveURL(/\/empresa\/estado$/);
    await expect(
      page.getByText('A Empresa não pode publicar vagas nem aceder a candidatos.'),
    ).toBeVisible();

    for (const path of ['/vagas', '/vagas/nova', '/candidatos', '/matches', '/conversas']) {
      await page.goto(path);
      await expect(page, `acesso direto a ${path}`).not.toHaveURL(new RegExp(`${path}$`));
    }
  });
});
