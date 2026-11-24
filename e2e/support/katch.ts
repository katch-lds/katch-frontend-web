import { expect, request, type APIRequestContext, type Page } from '@playwright/test';

/**
 * I079 — apoio aos testes de sistema do frontend web (plano de testes do frontend web, secções 5 a 7).
 *
 * Os testes correm contra a API local com os dados de demonstração (03-seed-demo-data.sql). As palavras-passe vêm de
 * variáveis de ambiente e nunca ficam no repositório (RNF003): E2E_DEMO_PASSWORD (contas de demonstração) e
 * E2E_ADMIN_PASSWORD (Administrador). Os dados que um cenário altera são criados pelo próprio cenário pela API, com
 * um sufixo único, para que a execução se possa repetir sem repor a base.
 */

export const apiUrl = process.env.E2E_API_URL ?? 'http://localhost:5180';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta a variável de ambiente ${name} (ver e2e/README.md).`);
  }
  return value;
}

export const demoPassword = (): string => requiredEnv('E2E_DEMO_PASSWORD');
export const adminPassword = (): string => requiredEnv('E2E_ADMIN_PASSWORD');

export const adminEmail = 'admin@katch.pt';

/** Contas e dados de demonstração usados pelos cenários (03-seed-demo-data.sql). */
export const demo = {
  recruiter1: 'recrutador1@demo.katch.pt', // Nortecode Soluções Digitais, Lda. (aprovada)
  recruiter2: 'recrutador2@demo.katch.pt', // Vale do Sousa Logística, S.A. (aprovada)
  recruiter6: 'recrutador6@demo.katch.pt', // Minho Metalomecânica, Lda. (pendente)
  recruiter7: 'recrutador7@demo.katch.pt', // Clínica Ribeirinha, Lda. (pendente)
  company1: 'Nortecode Soluções Digitais, Lda.',
  company3: 'Sabores do Tâmega, Lda.',
  company6: 'Minho Metalomecânica, Lda.',
  company7: 'Clínica Ribeirinha, Lda.',
  candidate: (n: number) => `candidato${String(n).padStart(2, '0')}@demo.katch.pt`,
};

/** Sufixo único por execução, para nomes e correios criados pelos testes. */
export function unique(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

/** NIF português válido (algarismo de controlo, módulo 11), começado por 5 (pessoa coletiva). */
export function validNif(): string {
  const base = `5${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
  const sum = [...base].reduce((acc, digit, i) => acc + Number(digit) * (9 - i), 0);
  const check = 11 - (sum % 11);
  return `${base}${check >= 10 ? 0 : check}`;
}

/** Palavra-passe válida (P05) para as contas criadas pelos testes; não é a de demonstração. */
export const newPassword = (): string => `Teste${Math.floor(Math.random() * 1e6)}a1`;

// ---------------------------------------------------------------------------------------------------------------
// API

export interface Session {
  token: string;
  userId: string;
  api: APIRequestContext;
}

export async function apiLogin(
  email: string,
  password: string,
  client: 'web' | 'mobile' = 'web',
): Promise<Session> {
  const anonymous = await request.newContext({ baseURL: apiUrl });
  const response = await anonymous.post('/api/auth/login', {
    headers: { 'X-Client-App': client },
    data: { email, password },
  });
  expect(response.status(), `início de sessão de ${email}`).toBe(200);
  const body = (await response.json()) as { token: string; userId: string };
  await anonymous.dispose();
  const api = await request.newContext({
    baseURL: apiUrl,
    extraHTTPHeaders: { Authorization: `Bearer ${body.token}` },
  });
  return { token: body.token, userId: body.userId, api };
}

export const adminApi = (): Promise<Session> => apiLogin(adminEmail, adminPassword());

/** Resultado de um pedido à API: estado HTTP e, num erro, o código ERR-nn do corpo. */
export interface ApiOutcome {
  status: number;
  code?: string;
}

/** Estado HTTP e código de erro de uma resposta, sem a verificar (casos de erro). */
export async function outcome(
  response: Awaited<ReturnType<APIRequestContext['get']>>,
): Promise<ApiOutcome> {
  const status = response.status();
  if (response.ok()) {
    return { status };
  }
  const body = (await response.json().catch(() => ({}))) as { code?: string };
  return { status, code: body.code };
}

/** Pedido de início de sessão sem verificar o resultado (casos de erro). */
export async function rawLogin(
  email: string,
  password: string,
  client: 'web' | 'mobile',
): Promise<ApiOutcome> {
  const anonymous = await request.newContext({ baseURL: apiUrl });
  const response = await anonymous.post('/api/auth/login', {
    headers: { 'X-Client-App': client },
    data: { email, password },
  });
  const result = await outcome(response);
  await anonymous.dispose();
  return result;
}

export async function ok<T>(
  response: Awaited<ReturnType<APIRequestContext['get']>>,
  what: string,
): Promise<T> {
  expect(response.ok(), `${what}: ${response.status()} ${await response.text()}`).toBeTruthy();
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function firstLocationId(session: Session): Promise<string> {
  const items = await ok<{ id: string }[]>(
    await session.api.get('/api/reference-lists/locations'),
    'localidades',
  );
  return items[0].id;
}

export async function firstSkillId(session: Session): Promise<string> {
  const items = await ok<{ id: string }[]>(
    await session.api.get('/api/reference-lists/skills'),
    'competências',
  );
  return items[0].id;
}

export interface TestRecruiter {
  email: string;
  password: string;
  companyName: string;
  companyId: string;
  userId: string;
}

/**
 * Cria uma conta de Recrutador e regista a Empresa pela API; com `approve`, o Administrador aprova-a.
 */
export async function createRecruiter(options: {
  approve: boolean;
  prefix?: string;
}): Promise<TestRecruiter> {
  const email = `${unique(options.prefix ?? 'e2e')}@teste.katch.pt`;
  const password = newPassword();
  const anonymous = await request.newContext({ baseURL: apiUrl });
  await ok(
    await anonymous.post('/api/auth/recruiters', { data: { email, password, acceptTerms: true } }),
    'criar conta de Recrutador',
  );
  await anonymous.dispose();
  const recruiter = await apiLogin(email, password);
  const companyName = `Empresa ${unique('E2E')}, Lda.`;
  await ok(
    await recruiter.api.post('/api/recruiter/company', {
      data: {
        companyName,
        taxId: validNif(),
        industry: 'TECHNOLOGY',
        address: 'Rua dos Testes, n.º 1',
        locationId: await firstLocationId(recruiter),
        contactEmail: email,
        contactPhone: '910000000',
        responsibleName: 'Responsável de Teste',
      },
    }),
    'registar Empresa',
  );
  const status = await ok<{ companyId: string }>(
    await recruiter.api.get('/api/recruiter/company/status'),
    'estado',
  );
  if (options.approve) {
    const admin = await adminApi();
    await ok(
      await admin.api.post(`/api/admin/companies/${status.companyId}/approve`),
      'aprovar Empresa',
    );
  }
  return { email, password, companyName, companyId: status.companyId, userId: recruiter.userId };
}

export interface TestJob {
  jobId: string;
  title: string;
}

/** Cria e publica uma vaga da Empresa do Recrutador. */
export async function createJob(session: Session, title = unique('Vaga E2E')): Promise<TestJob> {
  const job = await ok<{ jobId: string }>(
    await session.api.post('/api/recruiter/jobs', {
      data: {
        title,
        description: 'Vaga criada pelos testes de sistema.',
        minSalary: 1000,
        maxSalary: 1500,
        locationId: await firstLocationId(session),
        contractType: 'PERMANENT',
        workMode: 'ON_SITE',
        skillIds: [await firstSkillId(session)],
        benefitIds: [],
        isUrgent: false,
        expiresAt: null,
      },
    }),
    'criar vaga',
  );
  await ok(await session.api.post(`/api/recruiter/jobs/${job.jobId}/publish`), 'publicar vaga');
  return { jobId: job.jobId, title };
}

/** O Candidato de demonstração manifesta interesse na vaga (pedido direto da aplicação móvel). */
export async function candidateInterest(candidateEmail: string, jobId: string): Promise<Session> {
  const candidate = await apiLogin(candidateEmail, demoPassword(), 'mobile');
  await ok(
    await candidate.api.post(`/api/candidate/jobs/${jobId}/interest`),
    'manifestar interesse',
  );
  return candidate;
}

/** Interesse aceite pelo Recrutador: devolve o matchId e a sessão do Candidato. */
export async function createMatch(
  recruiter: Session,
  jobId: string,
  candidateEmail: string,
): Promise<{ matchId: string; candidate: Session }> {
  const candidate = await candidateInterest(candidateEmail, jobId);
  const waiting = await ok<{ matchId: string; candidateId: string }[]>(
    await recruiter.api.get(`/api/recruiter/jobs/${jobId}/waiting-candidates`),
    'candidatos em espera',
  );
  const match = waiting.find((w) => w.candidateId === candidate.userId) ?? waiting[0];
  await ok(
    await recruiter.api.get(`/api/recruiter/interests/${match.matchId}/profile`),
    'abrir perfil',
  );
  await ok(await recruiter.api.post(`/api/recruiter/interests/${match.matchId}/accept`), 'aceitar');
  return { matchId: match.matchId, candidate };
}

// ---------------------------------------------------------------------------------------------------------------
// Interface

/** Início de sessão pela interface: área do Recrutador (/entrar) ou da supervisão (/admin/entrar). */
export async function loginUi(
  page: Page,
  email: string,
  password: string,
  area: 'recruiter' | 'admin' = 'recruiter',
) {
  await page.goto(area === 'admin' ? '/admin/entrar' : '/entrar');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Palavra-passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

export async function loginRecruiter(page: Page, email: string, password: string) {
  await loginUi(page, email, password);
  await expect(page).not.toHaveURL(/\/entrar$/);
}

export async function loginAdmin(page: Page) {
  await loginUi(page, adminEmail, adminPassword(), 'admin');
  await expect(page).toHaveURL(/\/admin\/indicadores/);
}

/** Linha de uma tabela que contém o texto. */
export const row = (page: Page, text: string | RegExp) =>
  page.getByRole('row').filter({ hasText: text });

/** Confirma a caixa de diálogo aberta pelo botão com o nome indicado. */
export async function confirmDialog(page: Page, confirmLabel: string | RegExp) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: confirmLabel }).click();
  await expect(dialog).toBeHidden();
}

/** Mensagem de falha de ligação do HttpApiClient (ApiError.ts; RNF018). */
export const connectionFailureText = 'Não foi possível contactar o servidor.';

/** Imagem PNG válida de 1x1 píxel. */
export const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** Procura a linha nas páginas de uma tabela paginada («Seguinte»). */
export async function findRow(page: Page, text: string | RegExp) {
  for (let i = 0; i < 30; i += 1) {
    const line = row(page, text);
    if (await line.count()) {
      return line.first();
    }
    const next = page
      .getByRole('navigation', { name: 'Paginação' })
      .getByRole('button', { name: 'Seguinte' });
    if (!(await next.count()) || (await next.isDisabled())) {
      break;
    }
    // Espera que a página seguinte substitua as linhas, em vez de um tempo fixo.
    const firstRow = page.getByRole('row').nth(1);
    const before = await firstRow.innerText();
    await next.click();
    await expect(firstRow).not.toHaveText(before);
  }
  return row(page, text).first();
}
