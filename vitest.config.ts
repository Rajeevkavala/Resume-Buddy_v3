import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'services'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        '.next',
        '**/*.d.ts',
        '**/*.config.*',
        'services',
        'scripts',
        'infrastructure',
        'public',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@resumebuddy/auth': path.resolve(__dirname, 'packages/auth/src'),
      '@resumebuddy/database': path.resolve(__dirname, 'packages/database/src'),
      '@resumebuddy/storage': path.resolve(__dirname, 'packages/storage/src'),
      '@resumebuddy/queue': path.resolve(__dirname, 'packages/queue/src'),
      '@resumebuddy/shared': path.resolve(__dirname, 'packages/shared/src'),
    },
  },
});
