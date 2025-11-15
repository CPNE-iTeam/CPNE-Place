import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // racine du projet
  build: {
    outDir: 'dist', // dossier de build
  },
  server: {
    port: 3000,
  },
});
