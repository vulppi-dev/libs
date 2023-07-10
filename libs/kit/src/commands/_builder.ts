import { build } from 'esbuild'
import { clearExtension, join } from '../utils/path'

interface CallBuildProps {
  input: string
  output: string
  entries: string[]
}

export async function callBuild({ input, output, entries }: CallBuildProps) {
  const entryPoints = entries.reduce(
    (acc, p) => ({
      ...acc,
      [clearExtension(p)]: join(input, p),
    }),
    {},
  )

  await build({
    entryPoints,
    bundle: true,
    minify: true,
    sourcemap: true,
    packages: 'external',
    target: 'node18',
    platform: 'node',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    outdir: output,
    logLevel: 'info',
  })
}
