import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3005,
    proxy: {
      '/api': {
        target: 'https://dev-cms.rac.kyanon.dev',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
