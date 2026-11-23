import { expect, test, type Page } from '@playwright/test';
import {
  apiLogin,
  candidateInterest,
  createJob,
  createRecruiter,
  demo,
  loginRecruiter,
  row,
  unique,
} from './support/katch';

// SW-07 — Ciclo de vida da vaga (RF054 a RF056, RF058, RF114, RF115).
async function act(page: Page, title: string, action: string) {
  await row(page, title).getByRole('button', { name: action, exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: action, exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

test.describe('SW-07 Ciclo de vida da vaga', () => {
  test('SW-07a altera, suspende, volta a publicar e encerra uma vaga; elimina uma vaga sem interesses', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw07' });
    const session = await apiLogin(recruiter.email, recruiter.password);
    const job = await createJob(session);
    const other = await createJob(session);
    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto('/vagas');

    await row(page, job.title).getByRole('button', { name: 'Editar' }).click();
    const newTitle = unique('Vaga alterada');
    await page.getByLabel('Função').fill(newTitle);
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page).toHaveURL(/\/vagas$/);
    await expect(row(page, newTitle)).toBeVisible();

    await act(page, newTitle, 'Suspender');
    await expect(row(page, newTitle)).toContainText('Suspensa');
    await act(page, newTitle, 'Voltar a publicar');
    await expect(row(page, newTitle)).toContainText('Publicada');
    await act(page, newTitle, 'Encerrar');
    await expect(row(page, newTitle)).toContainText('Encerrada');

    await act(page, other.title, 'Eliminar');
    await expect(row(page, other.title)).toHaveCount(0);
  });

  test('SW-07b a eliminação de uma vaga com interesses é impedida', async ({ page }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw07b' });
    const session = await apiLogin(recruiter.email, recruiter.password);
    const job = await createJob(session);
    await candidateInterest(demo.candidate(9), job.jobId);

    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto('/vagas');
    await row(page, job.title).getByRole('button', { name: 'Eliminar', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(
      page.getByRole('dialog', { name: 'Não é possível eliminar a vaga' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Voltar' }).click();
    await expect(row(page, job.title)).toBeVisible();
  });
});
