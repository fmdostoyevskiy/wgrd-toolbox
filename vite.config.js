import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  base: '/wgrd-toolbox/',
  resolve: {
    alias: {
      '@units-core': path.resolve(__dirname, 'src/units-core'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        home:        path.resolve(__dirname, 'index.html'),
        armory:      path.resolve(__dirname, 'armory/index.html'),
        spreadsheet: path.resolve(__dirname, 'spreadsheet/index.html'),
      },
    },
  },
});
