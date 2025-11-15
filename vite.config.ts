import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // racine du projet
  base: './', // base pour les ressources
  build: {
    outDir: 'dist', // dossier de build
  },
  server: {
    port: 3000,
  },
});
