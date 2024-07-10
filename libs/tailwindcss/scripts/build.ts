/// <reference types="node" />

import { build, BuildOptions } from 'esbuild'
import tscPlugin from 'esbuild-plugin-tsc'
import { exec } from 'child_process'

const args = process.argv.slice(2)

const baseConfig = {
  entryPoints: args.map((file) => `src/${file}.ts`),
  bundle: true,
  outdir: 'dist',
  packages: 'external',
  target: 'node18',
  minifyWhitespace: true,
  minifySyntax: true,
  plugins: [tscPlugin({ force: true })],
} satisfies BuildOptions

await Promise.all([
  build({
    ...baseConfig,
    outExtension: { '.js': '.mjs' },
    format: 'esm',
  }),
  build({
    ...baseConfig,
    outExtension: { '.js': '.cjs' },
    format: 'cjs',
  }),
  build({
    ...baseConfig,
    format: 'iife',
  }),
  ...args.map(async (file) =>
    exec(
      [
        'pnpm exec',
        'dts-bundle-generator',
        '-o',
        `dist/${file}.d.ts`,
        `src/${file}.ts`,
        '--no-check',
        '--export-referenced-types',
        'false',
      ].join(' '),
    ),
  ),
])
