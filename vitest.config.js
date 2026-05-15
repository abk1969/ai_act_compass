import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
    // Per-file environment override: *.dom.test.jsx files run in jsdom for
    // component testing; everything else stays in fast node env.
    environmentMatchGlobs: [
      ['src/**/*.dom.test.jsx', 'jsdom'],
    ],
    setupFiles: ['./src/test-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.js'],
      exclude: ['src/lib/**/*.test.js'],
    },
  },
});
