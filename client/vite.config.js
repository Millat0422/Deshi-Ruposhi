import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development, requests to /api are forwarded to the Express server,
// so the frontend can simply call "/api/..." without CORS issues.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 700,
  },
});
