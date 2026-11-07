import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Configuração do Vite (I120, I069). O endereço da API vem de VITE_API_BASE_URL (ficheiros .env.*).
// Em desenvolvimento, os pedidos a /api passam pelo proxy abaixo (VITE_PROXY_TARGET), porque o backend não tem
// CORS e o login envia o cabeçalho personalizado X-Client-App, que o browser bloquearia num pedido direto.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:5180',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
