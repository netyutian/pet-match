import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
