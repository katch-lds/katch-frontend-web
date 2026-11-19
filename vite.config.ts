/**
 * Configuração do Vite.
 *
 * O endereço da API vem de `VITE_API_BASE_URL` (ficheiros `.env.*`). Em `npm run dev` os pedidos são relativos e o
 * proxy reencaminha `/api` para `VITE_PROXY_TARGET`, o backend local.
 *
 * @param mode Modo do Vite (`development` ou `production`), que escolhe os ficheiros `.env.*`.
 * @returns A configuração do Vite: plugin do React e proxy de `/api`.
 */
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:5180',
          changeOrigin: true,
        },
      },
    },
  };
});
