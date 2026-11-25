import { expect, test, type Page } from '@playwright/test';
import {
  apiLogin,
  createJob,
  createRecruiter,
  demo,
  demoPassword,
  loginAdmin,
  loginRecruiter,
} from './support/katch';

// SW-20 — Sem deslocamento horizontal a 1280 e 1920 píxeis (RNF012; modelo de classes, secções 8.2 e 8.3).
const widths = [1280, 1920];

async function noHorizontalScroll(page: Page, path: string) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    // A página está desenhada quando o título principal aparece (sem depender de networkidle).
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${path} a ${width} px`).toBeLessThanOrEqual(0);
  }
}

test.describe('SW-20 Sem deslocamento horizontal', () => {
  test('SW-20a páginas sem sessão', async ({ page }) => {
    for (const path of ['/entrar', '/criar-conta', '/admin/entrar']) {
      await noHorizontalScroll(page, path);
    }
  });

  test('SW-20b páginas do Recrutador', async ({ page }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw20' });
    const job = await createJob(await apiLogin(recruiter.email, recruiter.password));
    await loginRecruiter(page, recruiter.email, recruiter.password);
    for (const path of [
      '/vagas',
      '/vagas/nova',
      `/vagas/${job.jobId}/editar`,
      '/candidatos',
      '/matches',
      '/conversas',
      '/empresa',
      '/conta',
    ]) {
      await noHorizontalScroll(page, path);
    }
  });

  test('SW-20c páginas do Recrutador com dados (Nortecode)', async ({ page }) => {
    await loginRecruiter(page, demo.recruiter1, demoPassword());
    for (const path of ['/matches', '/conversas']) {
      await noHorizontalScroll(page, path);
    }
  });

  test('SW-20d páginas da supervisão', async ({ page }) => {
    await loginAdmin(page);
    for (const path of [
      '/admin/indicadores',
      '/admin/pendentes',
      '/admin/empresas',
      '/admin/vagas',
      '/admin/contas',
      '/admin/candidatos',
      '/admin/listas',
      '/admin/conta',
    ]) {
      await noHorizontalScroll(page, path);
    }
  });
});
