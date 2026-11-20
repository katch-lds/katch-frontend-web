# katch-frontend-web

Área de gestão web do Katch, para o Recrutador e o Administrador. React 19 com Vite e TypeScript.

## Requisitos

- Node.js 24 LTS e npm.
- API do `katch-backend` em execução (por omissão, `http://localhost:5180`).

## Comandos

| Comando                 | O que faz                                              |
| ----------------------- | ------------------------------------------------------ |
| `npm ci`                | Instala as dependências fixadas no `package-lock.json` |
| `npm run dev`           | Arranca o servidor de desenvolvimento do Vite          |
| `npm run build`         | Verifica os tipos (`tsc -b`) e gera `dist/` (QG-01)    |
| `npm run lint`          | ESLint, sem avisos admitidos (QG-05)                   |
| `npm run format:check`  | Prettier (QG-05)                                       |
| `npm test`              | Jest, sem cobertura                                    |
| `npm run test:coverage` | Jest com cobertura; falha abaixo de 40% das linhas     |

## Configuração por ambiente

| Variável              | Para quê                                                                          |
| --------------------- | --------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`   | Endereço da API. Vazio em desenvolvimento: os pedidos são relativos (`/api/...`). |
| `VITE_PROXY_TARGET`   | Destino do proxy do Vite em `npm run dev` (por omissão `http://localhost:5180`).  |
| `VITE_API_TIMEOUT_MS` | Tempo limite de cada pedido, inferior a 10 segundos.                              |

`.env.development` serve o desenvolvimento local e `.env.production.local` (a partir de `.env.example`, fora do Git)
o build de produção. Na pipeline, `VITE_API_BASE_URL` vem das variáveis do repositório. Não há segredos nestes
ficheiros.

**Proxy e CORS.** Em `npm run dev`, o Vite reencaminha `/api` para `VITE_PROXY_TARGET` (`server.proxy` em
`vite.config.ts`). O proxy só existe em `npm run dev`: um build de produção chama `VITE_API_BASE_URL` diretamente,
por isso a origem onde é servido tem de estar autorizada no CORS do backend (variável `Cors__AllowedOrigins` do
`katch-backend`). Para testes manuais, usar o backend local e não o ambiente público.

## Estrutura

As pastas de `src/` seguem as camadas do modelo de classes do frontend web v02 (secção 2.1):

| Pasta        | Conteúdo                                                                          |
| ------------ | --------------------------------------------------------------------------------- |
| `pages`      | Um componente por ecrã do protótipo                                               |
| `components` | Componentes reutilizados: campos, diálogos, tabela, paginação, painéis da Empresa |
| `layouts`    | Molduras do Recrutador (`RecruiterShell`) e da supervisão (`AdminShell`)          |
| `routes`     | Rotas, caminhos e proteções de navegação                                          |
| `hooks`      | Estado e pedidos de cada ecrã; `ConversationsProvider`                            |
| `services`   | Um serviço por controlador da API v02                                             |
| `api`        | Cliente HTTP da API v02 e erros da API                                            |
| `polling`    | Consulta periódica das conversas                                                  |
| `session`    | Sessão (`SessionStore`) e `SessionProvider`                                       |
| `validation` | Regras dos formulários, aplicadas antes de enviar                                 |
| `types`      | DTOs da API e designações apresentadas                                            |
| `utils`      | Datas, endereços e erros da API                                                   |
| `config`     | Configuração por ambiente                                                         |

A sessão fica em memória e no `sessionStorage` do separador (nunca no `localStorage`).

## Rotas

As proteções de rota são só de navegação: a autorização é sempre do servidor. Os requisitos são os do registo
[`m3-especificacao-requisitos-v02.md`](https://github.com/katch-lds/katch-docs/blob/main/04-artefactos-tecnicos/04.03-requisitos-e-rtm/m3-especificacao-requisitos-v02.md)
do `katch-docs`; cada rota de `src/routes/AppRouter.tsx` tem um comentário com os seus IDs.

| Rota                          | Ecrãs          | Requisitos                               |
| ----------------------------- | -------------- | ---------------------------------------- |
| `/entrar`                     | W01            | RF038                                    |
| `/criar-conta`                | W02            | RF037                                    |
| `/empresa/registo`            | W03, W04       | RF041, RF042                             |
| `/empresa/estado`             | W05, W06, W26  | RF043 a RF045                            |
| `/conta`                      | W25            | RF040, RF106                             |
| `/empresa`                    | W07, W08       | RF046 a RF049                            |
| `/vagas`                      | W09, W12 a W15 | RF053, RF055, RF056, RF058, RF114, RF115 |
| `/vagas/nova`                 | W10            | RF050 a RF052                            |
| `/vagas/:jobId/editar`        | W11            | RF054                                    |
| `/candidatos`                 | W16            | RF060                                    |
| `/candidatos/:matchId`        | W17            | RF061 a RF064, RF117                     |
| `/candidatos/:matchId/match`  | W19            | RF066                                    |
| `/matches`                    | W21            | RF067                                    |
| `/conversas`                  | W22, W23       | RF069 a RF075, RF109                     |
| `/admin/entrar`               | A01            | RF083                                    |
| `/admin/indicadores`          | A02            | RF096                                    |
| `/admin/pendentes`            | A03            | RF091                                    |
| `/admin/pendentes/:companyId` | A04            | RF092 a RF094                            |
| `/admin/empresas`             | A05            | RF095, RF097, RF116                      |
| `/admin/vagas`                | A06            | RF098                                    |
| `/admin/contas`               | A07            | RF085 a RF087                            |
| `/admin/candidatos`           | A08            | RF088 a RF090                            |
| `/admin/listas`               | A09            | RF099 a RF102                            |
| `/admin/conta`                | A10            | RF084                                    |
| `/acesso-negado`              | A11            | RF104                                    |

As rotas do Recrutador exigem a Empresa no estado certo (RF039): sem Empresa, só o registo; pendente, recusada ou
suspensa, o estado do pedido; aprovada, as vagas, os candidatos, os matches e a página da Empresa. As conversas abrem
com a Empresa aprovada ou suspensa e a conta está sempre acessível.

## Testes

Os testes unitários (Jest e Testing Library) ficam ao lado de cada unidade (`*.test.ts`, `*.test.tsx`); `test/` tem
os dados de teste, as simulações e a preparação do Jest. Os testes de sistema (QG-06, Playwright) ainda não existem:
o passo da pipeline só corre quando houver um `playwright.config.ts`.

## Pipeline CI

`.github/workflows/ci.yml`: `build-and-test` (QG-01, QG-05 ESLint e Prettier, testes unitários com cobertura mínima
de 40%, e o QG-06 preparado) e `static-analysis` (QG-05 SonarQube, com o Quality Gate «Katch QG-05»). A instância
SonarQube é criada em cada execução e usa o secret `SONAR_ADMIN_PASSWORD`.
