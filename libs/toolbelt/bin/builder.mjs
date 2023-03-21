#!/usr/bin/env node

import esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import parseArgs from 'minimist'

const args = parseArgs(process.argv.slice(2))

const outDir = args.outDir || 'dist'
const entryPoints = args._.length ? args._ : ['src/index.ts']
const onlyModule = !!(args.esm || args.mjs)
const onlyCommon = !!(args.common || args.cjs)
const watch = !!(args.watch || args.w)
const minify = args.minify ? true : args.m ?? true

// Build ESM
if (!onlyCommon) {
  esbuild.build({
    entryPoints: entryPoints,
    outfile: `${outDir}/index.mjs`,
    bundle: true,
    minify,
    platform: 'node',
    sourcemap: true,
    target: 'node16',
    format: 'esm',
    plugins: [nodeExternalsPlugin()],
    watch,
  })
}

// Build CommonJS
if (!onlyModule) {
  esbuild.build({
    entryPoints: entryPoints,
    outfile: `${outDir}/index.cjs`,
    bundle: true,
    minify,
    platform: 'node',
    sourcemap: true,
    target: 'node16',
    format: 'cjs',
    plugins: [nodeExternalsPlugin()],
    watch,
  })
}
