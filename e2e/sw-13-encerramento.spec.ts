import { expect, test } from '@playwright/test';
import {
  adminApi,
  apiLogin,
  candidateInterest,
  createJob,
  createMatch,
  createRecruiter,
  demo,
  loginRecruiter,
  ok,
} from './support/katch';

// SW-13 — Encerramento e modo apenas de consulta (RF070, RF074, RF075).
test.describe('SW-13 Encerramento e modo apenas de consulta', () => {
  test('SW-13a encerrar deixa o histórico visível e impede o envio', async ({ page }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw13a' });
    const session = await apiLogin(recruiter.email, recruiter.password);
    const job = await createJob(session);
    const { matchId } = await createMatch(session, job.jobId, demo.candidate(15));
    await ok(
      await session.api.post(`/api/conversations/${matchId}/messages`, {
        data: { content: 'Mensagem antes de encerrar.' },
      }),
      'mensagem',
    );

    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto(`/conversas?match=${matchId}`);
    await page.getByRole('button', { name: 'Encerrar conversa' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Encerrar conversa' }).click();

    await expect(page.getByText(/Conversa encerrada\. Apenas consulta\./)).toBeVisible();
    await expect(page.getByText('Mensagem antes de encerrar.')).toBeVisible();
    await expect(page.getByLabel('Mensagem')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  test('SW-13b bloquear a conta do Candidato passa a conversa a apenas consulta; sem match não há conversa', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw13b' });
    const session = await apiLogin(recruiter.email, recruiter.password);
    const job = await createJob(session);
    const { matchId, candidate } = await createMatch(session, job.jobId, demo.candidate(16));
    const admin = await adminApi();
    await ok(
      await admin.api.post(`/api/admin/accounts/${candidate.userId}/block`),
      'bloquear Candidato',
    );

    try {
      await loginRecruiter(page, recruiter.email, recruiter.password);
      await page.goto(`/conversas?match=${matchId}`);
      await expect(page.getByText(/Conversa encerrada\. Apenas consulta\./)).toBeVisible();
      await expect(page.getByLabel('Mensagem')).toBeDisabled();

      // Sem match: um interesse ainda em espera não tem conversa.
      const other = await createJob(session);
      await candidateInterest(demo.candidate(18), other.jobId);
      const waiting = await ok<{ matchId: string }[]>(
        await session.api.get(`/api/recruiter/jobs/${other.jobId}/waiting-candidates`),
        'em espera',
      );
      const noMatch = await session.api.post(`/api/conversations/${waiting[0].matchId}/messages`, {
        data: { content: 'Olá' },
      });
      expect(noMatch.status()).toBeGreaterThanOrEqual(400);
      await page.goto(`/conversas?match=${waiting[0].matchId}`);
      await expect(page.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    } finally {
      await ok(
        await admin.api.post(`/api/admin/accounts/${candidate.userId}/reactivate`),
        'reativar Candidato',
      );
    }
  });

  test('SW-13c suspender a Empresa passa a conversa a apenas consulta', async () => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw13c' });
    const session = await apiLogin(recruiter.email, recruiter.password);
    const job = await createJob(session);
    const { matchId, candidate } = await createMatch(session, job.jobId, demo.candidate(19));
    const admin = await adminApi();
    await ok(
      await admin.api.post(`/api/admin/companies/${recruiter.companyId}/suspend`),
      'suspender Empresa',
    );

    // Com a Empresa suspensa, o Recrutador fica sem a área da Empresa; a conversa fica só de consulta para as duas partes.
    const conversations = await ok<{ matchId: string; status: string; closeReason: string }[]>(
      await candidate.api.get('/api/conversations'),
      'conversas do Candidato',
    );
    const conversation = conversations.find((c) => c.matchId === matchId);
    expect(conversation?.status).toBe('CLOSED');
    expect(conversation?.closeReason).toBe('COMPANY_SUSPENDED');
    const send = await candidate.api.post(`/api/conversations/${matchId}/messages`, {
      data: { content: 'Olá' },
    });
    expect(send.status()).toBeGreaterThanOrEqual(400);
  });
});
