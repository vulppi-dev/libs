#!/usr/bin/env node

import esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'

// Build ESM
esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.mjs',
  bundle: true,
  minify: true,
  platform: 'node',
  sourcemap: true,
  target: 'node16',
  format: 'esm',
  plugins: [nodeExternalsPlugin()],
})

// Build CommonJS
esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.cjs',
  bundle: true,
  minify: true,
  platform: 'node',
  sourcemap: true,
  target: 'node16',
  format: 'cjs',
  plugins: [nodeExternalsPlugin()],
})
