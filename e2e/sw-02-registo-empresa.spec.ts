import { expect, test, type Page } from '@playwright/test';
import { demo, newPassword, unique, validNif } from './support/katch';

// SW-02 — Criação da conta de Recrutador e registo da Empresa (RF037, RF041 a RF044).
async function createAccount(page: Page, email: string, password: string) {
  await page.goto('/criar-conta');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Palavra-passe', { exact: true }).fill(password);
  await page.getByLabel('Aceito as condições de utilização').check();
  await page.getByRole('button', { name: 'Criar conta' }).click();
}

async function fillCompany(page: Page, data: { name: string; nif: string; email: string }) {
  await page.getByLabel('Nome da Empresa').fill(data.name);
  await page.getByLabel('NIF').fill(data.nif);
  await page.getByLabel('Área de atividade').selectOption({ index: 1 });
  await page.getByLabel('Morada').fill('Rua dos Testes, n.º 2');
  await page.getByLabel('Localidade').selectOption({ index: 1 });
  await page.getByLabel('E-mail de contacto').fill(data.email);
  await page.getByLabel('Telefone de contacto').fill('910000001');
  await page.getByLabel('Nome do responsável').fill('Responsável de Teste');
}

const invalid = (page: Page) => page.locator('[aria-invalid="true"]');

test.describe('SW-02 Criação da conta de Recrutador e registo da Empresa', () => {
  test('SW-02a registo válido deixa a Empresa pendente e mostra o estado do pedido', async ({
    page,
  }) => {
    const email = `${unique('sw02')}@teste.katch.pt`;
    await createAccount(page, email, newPassword());
    await expect(page).toHaveURL(/\/empresa\/registo$/);

    await fillCompany(page, { name: `Empresa ${unique('SW02')}, Lda.`, nif: validNif(), email });
    await page.getByRole('button', { name: 'Pedir aprovação' }).click();

    await expect(page).toHaveURL(/\/empresa\/estado$/);
    await expect(page.getByText('A Empresa aguarda aprovação.')).toBeVisible();
    await expect(page.getByText('Pendente').first()).toBeVisible();
  });

  test('SW-02b correio eletrónico repetido é rejeitado', async ({ page }) => {
    await createAccount(page, demo.recruiter1, newPassword());
    await expect(page.getByRole('alert').or(invalid(page)).first()).toBeVisible();
    await expect(page).toHaveURL(/\/criar-conta$/);
  });

  test('SW-02c NIF com 8 algarismos e campo obrigatório vazio são rejeitados com o campo', async ({
    page,
  }) => {
    const email = `${unique('sw02c')}@teste.katch.pt`;
    await createAccount(page, email, newPassword());
    await expect(page).toHaveURL(/\/empresa\/registo$/);

    await fillCompany(page, { name: `Empresa ${unique('SW02c')}`, nif: '51234567', email });
    await page.getByRole('button', { name: 'Pedir aprovação' }).click();
    await expect(page.getByLabel('NIF')).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/\/empresa\/registo$/);

    await page.getByLabel('NIF').fill(validNif());
    await page.getByLabel('Morada').fill('');
    await page.getByRole('button', { name: 'Pedir aprovação' }).click();
    await expect(page.getByLabel('Morada')).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/\/empresa\/registo$/);
  });
});
