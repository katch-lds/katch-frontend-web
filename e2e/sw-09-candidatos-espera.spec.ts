import { expect, test } from '@playwright/test';
import {
  apiLogin,
  candidateInterest,
  createJob,
  createRecruiter,
  demo,
  firstSkillId,
  loginRecruiter,
  prepareCandidateProfile,
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
    // M12: o teste envia a fotografia e o CV do Candidato e dá-lhe a competência pretendida pela vaga.
    const candidateEmail = demo.candidate(10);
    await prepareCandidateProfile(candidateEmail, await firstSkillId(session));
    await candidateInterest(candidateEmail, job.jobId);

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
    const name = page.getByRole('heading', { level: 1 });
    await expect(name).toBeVisible();
    await expect(page.getByText(/Abertura do perfil registada/)).toBeVisible();

    // Fotografia de perfil carregada (não o marcador vazio).
    const photo = page.locator('.profile-grid img[alt^="Fotografia de "]');
    await expect(photo).toBeVisible();
    await expect
      .poll(() => photo.evaluate((element: HTMLImageElement) => element.naturalWidth))
      .toBeGreaterThan(0);

    // Competência que coincide com a vaga destacada, com a legenda.
    await expect(page.getByRole('heading', { name: 'Competências' })).toBeVisible();
    await expect(page.locator('.skill-tag.skill-match')).toHaveCount(1);
    await expect(page.locator('.skill-match')).toContainText('(coincide com a vaga)');
    await expect(
      page.getByText('✓ Competência que coincide com as pretendidas na vaga.'),
    ).toBeVisible();
    await expect(page.getByText('Hiperligações').first()).toBeVisible();

    // Descarga do CV: o pedido devolve o PDF enviado pelo teste.
    await expect(page.getByText('Curriculum vitae').first()).toBeVisible();
    await expect(page.getByText('Este candidato não tem CV.')).toHaveCount(0);
    const cvResponse = page.waitForResponse(
      (response) => response.request().method() === 'GET' && /\/cv$/.test(response.url()),
    );
    await page.getByRole('button', { name: 'Abrir CV (PDF)' }).click();
    const cv = await cvResponse;
    expect(cv.status()).toBe(200);
    expect(cv.headers()['content-type']).toContain('application/pdf');
    expect((await cv.body()).subarray(0, 5).toString('latin1')).toBe('%PDF-');

    await page.goto(`/candidatos?vaga=${empty.jobId}`);
    await expect(openProfile).toHaveCount(0);
  });
});
