import { expect, test } from '@playwright/test';
import { createRecruiter, loginRecruiter, row, tinyPng, unique } from './support/katch';

// SW-06 — Criação e publicação de vaga (RF050 a RF053).
test.describe('SW-06 Criação e publicação de vaga', () => {
  test('SW-06a cria uma vaga com todos os campos e publica-a; mínimo superior ao máximo é rejeitado', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw06' });
    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto('/vagas/nova');

    const title = unique('Programador E2E');
    await page.getByLabel('Função').fill(title);
    await page.getByLabel('Descrição').fill('Vaga criada no SW-06.');
    await page.getByLabel('Salário mínimo (€ brutos/mês)').fill('1500');
    await page.getByLabel('Salário máximo (€ brutos/mês)').fill('1200');
    await page.getByLabel('Localidade').selectOption({ index: 1 });
    await page.getByLabel('Contrato').selectOption({ index: 1 });
    await page.getByLabel('Regime').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('O valor mínimo não pode ser superior ao máximo.')).toBeVisible();
    await expect(page).toHaveURL(/\/vagas\/nova$/);

    await page.getByLabel('Salário máximo (€ brutos/mês)').fill('1900');
    const skills = page.getByRole('group', { name: /Competências/ }).getByRole('checkbox');
    await skills.first().check();
    const benefits = page.getByRole('group', { name: /Benefícios/ }).getByRole('checkbox');
    await benefits.first().check();
    await page.getByLabel('Marcar como urgente').check();
    const deadline = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    await page.getByLabel('Data-limite (opcional)').fill(deadline);
    const photos = page.getByLabel('Adicionar fotografia');
    if (await photos.count()) {
      await photos.setInputFiles({ name: 'vaga.png', mimeType: 'image/png', buffer: tinyPng });
    }
    await page.getByRole('button', { name: 'Guardar' }).click();

    await expect(page).toHaveURL(/\/vagas$/);
    const line = row(page, title);
    await expect(line).toContainText('Não publicada');
    await line.getByRole('button', { name: 'Publicar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Publicar' }).click();
    await expect(line).toContainText('Publicada');
  });
});
