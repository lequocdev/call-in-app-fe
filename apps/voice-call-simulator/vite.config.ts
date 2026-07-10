import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3005,
    proxy: {
      '/api': {
        target: 'https://guidance-manager-detection.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
