import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const frontendPort = Number(env.FRONTEND_PORT ?? 5173);
  const backendPort = Number(env.BACKEND_PORT ?? 8766);

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': `http://localhost:${backendPort}`
      }
    }
  };
});
