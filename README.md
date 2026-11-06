# katch-frontend-web

Área de gestão web do Katch, para o Recrutador e o Administrador. React 19 com Vite e TypeScript (I120).

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

**CORS.** O backend não tem CORS configurado e o login envia o cabeçalho `X-Client-App`, pelo que o browser bloqueia
os pedidos diretos de `localhost:5173` à API. Em desenvolvimento, o Vite reencaminha `/api` para `VITE_PROXY_TARGET`
(`server.proxy` em `vite.config.ts`). O proxy só existe em `npm run dev`: um build de produção servido noutro domínio
exige CORS no backend ou um reverse proxy. Para testes manuais, usar o backend local e não o ambiente público.

## Estrutura

As pastas de `src/` seguem as camadas do modelo de classes do frontend web v02 (secção 2.1): `pages`, `components`,
`routes`, `hooks`, `services`, `api` (cliente da API v02), `polling`, `session` e `types`.

## Pipeline CI

`.github/workflows/ci.yml`: `build-and-test` (QG-01, QG-05 ESLint e Prettier, testes unitários com cobertura mínima
de 40%, e o QG-06 preparado) e `static-analysis` (QG-05 SonarQube, com o Quality Gate «Katch QG-05»). A instância
SonarQube é criada em cada execução e usa o secret `SONAR_ADMIN_PASSWORD`.
