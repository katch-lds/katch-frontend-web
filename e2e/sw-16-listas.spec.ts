import { expect, test } from '@playwright/test';
import { createRecruiter, loginAdmin, loginRecruiter, unique } from './support/katch';

// SW-16 — Listas pré-definidas (RF099 a RF102).
test.describe('SW-16 Listas pré-definidas', () => {
  test('SW-16a acrescenta e altera uma competência e um benefício; repetida é rejeitada; aparece na criação de vagas', async ({
    page,
    browser,
  }) => {
    const skill = unique('Competência E2E');
    const benefit = unique('Benefício E2E');
    await loginAdmin(page);
    await page.goto('/admin/listas');
    await expect(page.getByRole('heading', { name: 'Listas pré-definidas' })).toBeVisible();

    const skills = page.getByRole('region', { name: 'Competências' });
    await skills.getByRole('textbox', { name: 'Nova competência', exact: true }).fill(skill);
    await skills.getByRole('button', { name: 'Acrescentar', exact: true }).click();
    await expect(skills.getByText(skill, { exact: true })).toBeVisible();

    await skills.getByRole('textbox', { name: 'Nova competência', exact: true }).fill(skill);
    await skills.getByRole('button', { name: 'Acrescentar', exact: true }).click();
    await expect(
      skills
        .getByRole('alert')
        .or(
          skills
            .getByRole('textbox', { name: 'Nova competência', exact: true })
            .and(page.locator('[aria-invalid="true"]')),
        )
        .first(),
    ).toBeVisible();
    await skills.getByRole('textbox', { name: 'Nova competência', exact: true }).fill('');

    const renamedSkill = `${skill} alterada`;
    await skills.getByRole('button', { name: `Alterar designação de ${skill}` }).click();
    await skills
      .getByRole('textbox', { name: `Nova designação de ${skill}`, exact: true })
      .fill(renamedSkill);
    await skills.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(skills.getByText(renamedSkill, { exact: true })).toBeVisible();

    const benefits = page.getByRole('region', { name: 'Benefícios' });
    await benefits.getByRole('textbox', { name: 'Novo benefício', exact: true }).fill(benefit);
    await benefits.getByRole('button', { name: 'Acrescentar', exact: true }).click();
    await expect(benefits.getByText(benefit, { exact: true })).toBeVisible();
    const renamedBenefit = `${benefit} alterado`;
    await benefits.getByRole('button', { name: `Alterar designação de ${benefit}` }).click();
    await benefits
      .getByRole('textbox', { name: `Nova designação de ${benefit}`, exact: true })
      .fill(renamedBenefit);
    await benefits.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(benefits.getByText(renamedBenefit, { exact: true })).toBeVisible();

    const recruiter = await createRecruiter({ approve: true, prefix: 'sw16' });
    const context = await browser.newContext();
    const recruiterPage = await context.newPage();
    await loginRecruiter(recruiterPage, recruiter.email, recruiter.password);
    await recruiterPage.goto('/vagas/nova');
    await expect(
      recruiterPage.getByRole('group', { name: /Competências/ }).getByLabel(renamedSkill),
    ).toBeVisible();
    await context.close();
  });
});
