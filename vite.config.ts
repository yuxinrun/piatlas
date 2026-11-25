import { defineConfig } from 'vite';
import { globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('./.generated/', import.meta.url));
export default defineConfig({
  root, base: '/piatlas/', publicDir: '../public',
  resolve: { alias: { '/site.ts': fileURLToPath(new URL('./src/site.ts', import.meta.url)) } },
  server: { fs: { allow: ['..'] } },
  build: { outDir: '../dist', emptyOutDir: true, rollupOptions: { input: globSync('**/*.html', { cwd: root }).map(path => `${root}${path}`) } },
});

