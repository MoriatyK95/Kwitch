import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
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
    // Same-origin UserSig in dev: when VITE_USERSIG_MODE=server and
    // VITE_USERSIG_SERVER_URL is empty, the app POSTs to /usersig on its own
    // origin and this proxy forwards it to the local UserSig server
    // (`npm run dev:server` at the repo root). Mirrors the nginx proxy used
    // in production, so dev and prod behave identically.
    proxy: {
      '/usersig': {
        target: process.env.USERSIG_PROXY_TARGET ?? 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
