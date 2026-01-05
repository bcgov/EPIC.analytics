import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'es2020',
  outDir: 'dist',

  dts: {
    resolve: false,
    compilerOptions: { skipLibCheck: true },
  },

  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: true,

  external: ['react', 'react-oidc-context'],
});
