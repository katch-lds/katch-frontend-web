import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Configuração do Vite (I120). O endereço da API vem de VITE_API_BASE_URL (ficheiros .env.*).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
