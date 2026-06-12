import { defineConfig } from 'vite';

export default defineConfig({
  preview: {
    allowedHosts: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
