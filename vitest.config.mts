import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['packages/**/test/**/*.test.ts', 'services/**/test/**/*.test.ts', 'deploy/test/**/*.test.ts'], testTimeout: 30_000, hookTimeout: 30_000, pool: 'forks' },
});
