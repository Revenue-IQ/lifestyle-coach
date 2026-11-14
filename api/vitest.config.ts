import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', '../shared/src/**/*.test.ts'],
  },
});
