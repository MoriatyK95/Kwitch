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
  },
});
