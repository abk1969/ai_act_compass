import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server pour ai-act-compass.jsx
// Tailwind est chargé via le Play CDN dans index.html (pas de build CSS local nécessaire).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    host: '127.0.0.1',
  },
});
