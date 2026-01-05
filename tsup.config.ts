import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    resolve: false, // Skip resolving types from external dependencies
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-oidc-context'],
  bundle: true,
  outDir: 'dist',
});


