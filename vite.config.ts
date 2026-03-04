import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Точка в начале делает все пути относительными. 
  // Теперь неважно, как называется ваш репозиторий.
  base: './', 
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
