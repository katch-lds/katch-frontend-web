import { expect, test } from '@playwright/test';
import {
  apiLogin,
  createJob,
  createMatch,
  createRecruiter,
  demo,
  loginRecruiter,
  ok,
} from './support/katch';

// SW-12 — Conversas do Recrutador (RF069 a RF073, RF109; P17).
test.describe('SW-12 Conversas do Recrutador', () => {
  test('SW-12a mensagens por ler, histórico, envio, receção sem recarregar e limite de 1000 caracteres', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw12' });
    const session = await apiLogin(recruiter.email, recruiter.password);
    const job = await createJob(session);
    const { matchId, candidate } = await createMatch(session, job.jobId, demo.candidate(14));
    await ok(
      await candidate.api.post(`/api/conversations/${matchId}/messages`, {
        data: { content: 'Bom dia, obrigado pelo match.' },
      }),
      'mensagem do Candidato',
    );

    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto('/conversas');
    const list = page.getByRole('list', { name: 'Lista de conversas' });
    await expect(list.getByText('1 por ler')).toBeVisible();

    await list.getByRole('button').first().click();
    const thread = page.getByRole('list', { name: 'Mensagens' });
    await expect(thread.getByText('Bom dia, obrigado pelo match.')).toBeVisible();
    await expect(list.getByText('por ler')).toHaveCount(0);

    await page.getByLabel('Mensagem').fill('Olá! Podemos marcar uma entrevista?');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(thread.getByText('Olá! Podemos marcar uma entrevista?')).toBeVisible();
    const items = thread.getByRole('listitem');
    await expect(items.last()).toContainText('Olá! Podemos marcar uma entrevista?');

    const sentAt = Date.now();
    await ok(
      await candidate.api.post(`/api/conversations/${matchId}/messages`, {
        data: { content: 'Sim, amanhã às 10h.' },
      }),
      'resposta do Candidato',
    );
    await expect(thread.getByText('Sim, amanhã às 10h.')).toBeVisible({ timeout: 5_000 });
    expect(Date.now() - sentAt).toBeLessThanOrEqual(5_000);

    await page.getByLabel('Mensagem').fill('x'.repeat(1001));
    await expect(page.getByLabel('Mensagem')).toHaveValue('x'.repeat(1000));
    const tooLong = await session.api.post(`/api/conversations/${matchId}/messages`, {
      data: { content: 'x'.repeat(1001) },
    });
    expect(tooLong.status()).toBe(400);
  });
});
