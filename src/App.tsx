import { appConfig } from './config/env';

/** Estrutura inicial da área de gestão web (I120). As rotas e as páginas chegam com as Issues dos ecrãs de m4. */
export default function App() {
  return (
    <main>
      <h1>Katch — Área de gestão</h1>
      <p>Recrutador e Administrador.</p>
      <p data-testid="api-base-url">API: {appConfig.apiBaseUrl || 'não configurada'}</p>
    </main>
  );
}
