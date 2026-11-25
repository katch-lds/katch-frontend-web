# Testes de sistema do frontend web (Playwright, QG-06)

Cenários `SW-01` a `SW-21` do plano de testes do frontend web (`m4-plano-testes-frontend-web-v01.md`, secção 7),
um ficheiro por cenário (`sw-nn-*.spec.ts`). A especificação de cada caso está em
`m4-especificacao-testes-sistema-frontend-web-v01.md` (`03.02.02-testes-de-sistema`).

## Executar localmente

1. Base de dados com os scripts `01` a `03` do katch-backend (`database/README.md`) e a API a correr em
   `http://localhost:5180`, com `Cors__AllowedOrigins` a incluir `http://localhost:4173` (README do backend).
2. No PowerShell, na raiz deste repositório:

```powershell
$env:E2E_DEMO_PASSWORD = "<palavra-passe das contas de demonstração>"
$env:E2E_ADMIN_PASSWORD = "<palavra-passe do Administrador>"
npx playwright install chromium     # só da primeira vez
npm run test:e2e
npx playwright show-report          # relatório HTML
```

O Playwright constrói o frontend com `VITE_API_BASE_URL` igual a `E2E_API_URL` (por omissão
`http://localhost:5180`) e serve-o com `vite preview` no porto 4173. Os cenários correm por ordem, num só worker.

Os cenários criam os seus próprios Recrutadores, Empresas e vagas (com um sufixo único), pelo que se podem repetir
sem repor a base. Usam as contas de demonstração `candidato09` a `candidato19` para os interesses e os matches: cada
execução gasta um interesse de cada uma; se a quota diária se esgotar, reponha a base (`00-reset-schema.sql` e
scripts `01` a `03`).

## Na pipeline

O job `build-and-test` do `ci.yml` cria o PostgreSQL, executa os scripts do katch-backend, arranca a API e corre os
testes; o relatório HTML (com vídeo, capturas e trace das falhas) fica no artefacto `playwright-report`. Segredos
do repositório necessários: `E2E_DEMO_PASSWORD`, `E2E_ADMIN_PASSWORD` e, se o katch-backend for privado,
`KATCH_BACKEND_TOKEN` (token com leitura do katch-backend).
