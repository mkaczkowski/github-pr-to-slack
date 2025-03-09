/// <reference types="vitest" />
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '**/node_modules/**', '**/dist/**'],
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: Math.max(1, Math.floor(require('os').cpus().length * 0.75)),
      },
    },
    testTimeout: 20000,
    retry: process.env.CI ? 2 : 0,
    environmentOptions: {
      'happy-dom': {
        asyncTimeout: 5000,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/types/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/test/**',
        '**/assets/**',
        '**/mocks/**',
        // 'src/background.ts',
        // 'src/theme-switcher.css',
        'vite.config.ts',
        'vitest.config.ts',
        'webpack.config.js',
        '.eslintrc.js',
        'scripts/**',
        'src/utils/chrome-polyfill.ts',
        'src/pages/content/content.ts',
        // 'src/pages/content/content.tsx',
        // 'src/pages/options/options.tsx',
        // 'src/pages/content/components/GithubSlackButton/**',
        // 'src/components/SlackIcon/**',
        '**/index.ts',
      ],
      thresholds: {
        statements: 55,
        branches: 81,
        functions: 78,
        lines: 55,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
