/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app deploys to GitHub Pages at https://ricschuster.github.io/wage_comp/,
// so assets must be served from that sub-path. For local dev the base is '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/wage_comp/' : '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      // The pure tax engine is where correctness lives; hold it to a bar.
      // Parameter tables in src/data are data, not logic, and are covered by
      // the golden tests that consume them rather than by direct unit tests.
      include: ['src/engine/**/*.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
}));
