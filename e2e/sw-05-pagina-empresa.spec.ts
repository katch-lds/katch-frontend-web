import { expect, test } from '@playwright/test';
import { createRecruiter, loginRecruiter, tinyPng } from './support/katch';

// SW-05 — Página e dados da Empresa (RF046 a RF049).
const png = (name: string) => ({ name, mimeType: 'image/png', buffer: tinyPng });

test.describe('SW-05 Página e dados da Empresa', () => {
  test('SW-05a grava a apresentação, o logótipo e a galeria e vê-os depois de recarregar; recusa os ficheiros inválidos', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw05' });
    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto('/empresa');

    const description = `Apresentação de teste ${Date.now()}.`;
    await page.getByLabel('Descrição').fill(description);
    await page.getByLabel('Sítio na Internet').fill('https://exemplo.katch.pt');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText('Página guardada')).toBeVisible();

    await page.getByLabel('Escolher').setInputFiles(png('logo.png'));
    await expect(page.getByText('A enviar…')).toHaveCount(0);

    const gallery = page.getByLabel('Adicionar fotografia');
    for (let i = 1; i <= 6; i += 1) {
      await gallery.setInputFiles(png(`foto-${i}.png`));
      await expect(page.getByText(`${i}/6`)).toBeVisible();
    }
    await gallery.setInputFiles(png('foto-7.png')).catch(() => undefined);
    await expect(page.getByText('6/6')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Descrição')).toHaveValue(description);
    await expect(page.getByText('6/6')).toBeVisible();
  });

  test('SW-05b imagem de 5 MB + 1 byte e conteúdo de outro formato são rejeitados', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw05b' });
    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto('/empresa');

    const big = Buffer.concat([tinyPng, Buffer.alloc(5 * 1024 * 1024 + 1 - tinyPng.length)]);
    await page
      .getByLabel('Adicionar fotografia')
      .setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: big });
    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page.getByText('0/6')).toBeVisible();

    await page
      .getByLabel('Adicionar fotografia')
      .setInputFiles({
        name: 'falso.png',
        mimeType: 'image/png',
        buffer: Buffer.from('isto não é uma imagem'),
      });
    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page.getByText('0/6')).toBeVisible();
  });

  test('SW-05c alteração dos dados de registo com erro de validação mostra o erro', async ({
    page,
  }) => {
    const recruiter = await createRecruiter({ approve: true, prefix: 'sw05c' });
    await loginRecruiter(page, recruiter.email, recruiter.password);
    await page.goto('/empresa');

    await page.getByRole('tab', { name: 'Dados da Empresa' }).click();
    await page.getByLabel('Nome do responsável').fill('');
    await page.getByRole('button', { name: 'Guardar alterações' }).click();
    await expect(page.getByLabel('Nome do responsável')).toHaveAttribute('aria-invalid', 'true');
  });
});
