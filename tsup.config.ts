import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['cli/index.ts'],
  outDir: 'cli-dist',
  format: ['cjs'],
  target: 'node18',
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
