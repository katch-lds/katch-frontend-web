import { expect, test } from '@playwright/test';
import {
  apiLogin,
  candidateInterest,
  createJob,
  createRecruiter,
  demo,
  loginRecruiter,
} from './support/katch';

// SW-10 — Decisão sobre o Candidato e match (RF063, RF064, RF066, RF117).
test.describe('SW-10 Decisão sobre o Candidato e match', () => {
  test('SW-10a aceitar confirma o match com o contacto; recusar retira o Candidato; a decisão não muda', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw10' });
    const session = await apiLogin(recruiter.email, recruiter.password);
    const job = await createJob(session);
    await candidateInterest(demo.candidate(11), job.jobId);
    await candidateInterest(demo.candidate(12), job.jobId);

    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto(`/candidatos?vaga=${job.jobId}`);
    const openProfile = () =>
      page
        .getByRole('button', { name: 'Abrir perfil' })
        .or(page.getByRole('link', { name: 'Abrir perfil' }));
    await expect(openProfile()).toHaveCount(2);

    await openProfile().first().click();
    const acceptedUrl = page.url();
    await page.getByRole('button', { name: 'Aceitar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Aceitar' }).click();
    await expect(page.getByRole('heading', { name: 'Match confirmado' })).toBeVisible();
    await expect(page.getByText('Telefone').first()).toBeVisible();
    await expect(page.getByText(/@demo\.katch\.pt/).first()).toBeVisible();

    await page.goto(`/candidatos?vaga=${job.jobId}`);
    await expect(openProfile()).toHaveCount(1);
    await openProfile().first().click();
    await page.getByRole('button', { name: 'Recusar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Recusar' }).click();
    await expect(
      page.getByText('Candidato recusado. Não volta a ser sugerido para esta vaga.'),
    ).toBeVisible();

    await page.goto(`/candidatos?vaga=${job.jobId}`);
    await expect(openProfile()).toHaveCount(0);

    await page.goto(acceptedUrl);
    await expect(page.getByRole('button', { name: 'Aceitar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Recusar' })).toHaveCount(0);
  });
});
