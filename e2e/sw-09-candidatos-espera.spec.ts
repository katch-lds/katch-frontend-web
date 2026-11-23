import { expect, test } from '@playwright/test';
import {
  apiLogin,
  candidateInterest,
  createJob,
  createRecruiter,
  demo,
  loginRecruiter,
} from './support/katch';

// SW-09 — Candidatos em espera e perfil completo (RF060 a RF062).
test.describe('SW-09 Candidatos em espera e perfil completo', () => {
  test('SW-09a lista os candidatos em espera sem ações de decisão e abre o perfil completo', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw09' });
    const session = await apiLogin(recruiter.email, recruiter.password);
    const job = await createJob(session);
    const empty = await createJob(session);
    await candidateInterest(demo.candidate(10), job.jobId);

    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto(`/candidatos?vaga=${job.jobId}`);
    await expect(page.getByRole('heading', { name: 'Candidatos em espera' })).toBeVisible();
    const openProfile = page
      .getByRole('button', { name: 'Abrir perfil' })
      .or(page.getByRole('link', { name: 'Abrir perfil' }));
    await expect(openProfile).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Aceitar' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Recusar' })).toHaveCount(0);

    await openProfile.click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText(/Abertura do perfil registada/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Competências' })).toBeVisible();
    await expect(page.getByText('Competências').first()).toBeVisible();
    await expect(page.getByText('Hiperligações').first()).toBeVisible();
    await expect(page.getByText('Curriculum vitae').first()).toBeVisible();
    const cv = page
      .getByRole('link', { name: 'Abrir CV (PDF)' })
      .or(page.getByRole('button', { name: 'Abrir CV (PDF)' }));
    if (await cv.count()) {
      const [response] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/cv')),
        cv.first().click(),
      ]);
      expect(response.status()).toBe(200);
    } else {
      await expect(page.getByText('Este candidato não tem CV.')).toBeVisible();
    }

    await page.goto(`/candidatos?vaga=${empty.jobId}`);
    await expect(openProfile).toHaveCount(0);
  });
});
