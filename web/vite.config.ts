import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { cloudflare } from '@cloudflare/vite-plugin';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [cloudflare(), vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // The camera/mic getUserMedia API requires a "secure context".
    // localhost counts as secure, so plain http works in dev. In production
    // you MUST serve over HTTPS — see docs/DEPLOYMENT.md.
    host: true,
    // Same-origin token API in dev: Vite proxies /token, /streams, and
    // /room-metadata to the local API server (`npm run dev:server` at repo root).
    proxy: {
      '/token': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3001',
        changeOrigin: true,
      },
      '/streams': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3001',
        changeOrigin: true,
      },
      '/room-metadata': {
        target: process.env.API_PROXY_TARGET ?? 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
