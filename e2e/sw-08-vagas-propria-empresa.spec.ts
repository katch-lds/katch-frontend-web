import { expect, test } from '@playwright/test';
import { apiLogin, createJob, createRecruiter, loginRecruiter } from './support/katch';

// SW-08 — Vagas só da própria Empresa (RF059).
test.describe('SW-08 Vagas só da própria Empresa', () => {
  test('SW-08a a listagem mostra só as vagas da Empresa e o URL de uma vaga de outra Empresa é negado', async ({
    page,
  }) => {
    const owner = await createRecruiter({ approve: true, prefix: 'sw08a' });
    const ownerJob = await createJob(await apiLogin(owner.email, owner.password));
    const other = await createRecruiter({ approve: true, prefix: 'sw08b' });
    const otherJob = await createJob(await apiLogin(other.email, other.password));

    await loginRecruiter(page, owner.email, owner.password);
    await page.goto('/vagas');
    await expect(page.getByText(ownerJob.title)).toBeVisible();
    await expect(page.getByText(otherJob.title)).toHaveCount(0);

    await page.goto(`/vagas/${otherJob.jobId}/editar`);
    await expect(page.getByRole('alert').or(page.getByText('Acesso negado')).first()).toBeVisible();
  });
});
