import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Use async config to handle ESM module
export default defineConfig(async () => {
  const tailwindcss = (await import('@tailwindcss/vite')).default;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'), // Keep your alias
      },
    },
    server: {
      port: 3000, // Matches CRA’s default port
    },
  };
});