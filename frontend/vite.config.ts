import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '');
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
        '@assets': path.resolve(import.meta.dirname, 'src/assets'),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: Number(process.env.PORT) || 3000,
      // Keep development source and debugging endpoints off the local network.
      // LAN testing can be explicitly enabled with DEV_SERVER_HOST when needed.
      host: process.env.DEV_SERVER_HOST || '127.0.0.1',
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || 'http://127.0.0.1:5050',
          changeOrigin: true,
        },
      },
    },
  };
});
