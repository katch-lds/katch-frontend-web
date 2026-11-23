import { expect, test } from '@playwright/test';
import {
  apiLogin,
  createJob,
  createMatch,
  createRecruiter,
  demo,
  loginRecruiter,
} from './support/katch';

// SW-11 — Matches da Empresa (RF067, RF068).
test.describe('SW-11 Matches da Empresa', () => {
  test('SW-11a a lista mostra só os matches da Empresa e abre a conversa criada', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw11' });
    const session = await apiLogin(recruiter.email, recruiter.password);
    const job = await createJob(session);
    await createMatch(session, job.jobId, demo.candidate(13));

    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto('/matches');
    await expect(page.getByRole('heading', { name: 'Matches da Empresa' })).toBeVisible();
    await expect(page.getByText(job.title).first()).toBeVisible();
    await expect(page.getByText(/candidato13@demo\.katch\.pt|900000113/).first()).toBeVisible();
    // Os matches de demonstração da Nortecode não aparecem noutra Empresa.
    await expect(page.getByText('Programador frontend React')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Abrir conversa' })).toHaveCount(1);

    await page.getByRole('button', { name: 'Abrir conversa' }).click();
    await expect(page).toHaveURL(/\/conversas\?match=/);
    await expect(page.getByLabel('Mensagem')).toBeEnabled();
  });
});
