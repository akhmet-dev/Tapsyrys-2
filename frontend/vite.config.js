import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite конфигурациясы
// Даму режимінде: proxy арқылы /api → localhost:5000
// Өндіріс режимінде: VITE_API_URL айнымалысы пайдаланылады (proxy жоқ)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy тек жергілікті дамуда жұмыс істейді
    // Vercel-де бұл блок мүлде орындалмайды
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
