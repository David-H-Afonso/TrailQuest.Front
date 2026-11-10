import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const webPort = Number(process.env.TRAILQUEST_WEB_PORT ?? 5186);
const apiTarget = process.env.TRAILQUEST_API_PROXY_TARGET ?? 'http://127.0.0.1:5187';
const target = new URL(apiTarget);
if (!Number.isInteger(webPort) || webPort < 1024 || webPort > 65535) throw new Error('TRAILQUEST_WEB_PORT must be an unprivileged port.');
if (!['http:', 'https:'].includes(target.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) || target.username || target.password || target.pathname !== '/' || target.search || target.hash) {
  throw new Error('TRAILQUEST_API_PROXY_TARGET must be a loopback origin without credentials or a path. Production uses the same-origin container proxy.');
}

const browserHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'",
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: webPort,
    strictPort: true,
    headers: browserHeaders,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
    },
  },
  preview: {
    headers: browserHeaders,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
    },
  },
});
