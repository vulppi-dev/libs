import { build } from 'esbuild'
import { glob } from 'glob'

/**
 *
 * @param {string} path
 * @returns {string}
 */
function normalizePath(path) {
  return path.replace(/[\\\/]+/g, '/').replace(/^[\/\\]*/, '')
}

/**
 *
 * @param  {...string} paths
 * @returns {string}
 */
function join(...paths) {
  return normalizePath(paths.join('/'))
}

/**
 *
 * @param {string} path
 * @param {string} ext
 * @returns {string[]}
 */
async function getEntries(path, ext) {
  const basePath = join(process.cwd(), 'src')
  const entry = join(basePath, path)
  const globPath = join(entry, ext)
  return await glob(globPath).then((paths) =>
    paths.map((p) => normalizePath(p).replace(basePath, '')),
  )
}

/**
 *
 * @param {string} path
 * @returns {string}
 */
function clearExtension(path) {
  return normalizePath(path).replace(/\.[a-z0-9]+$/, '')
}

async function callBuild() {
  const commands = await getEntries('commands', 'index.ts')
  const lib = await getEntries('lib', '*.ts')

  const entries = [...commands, ...lib].reduce(
    (acc, p) => ({
      ...acc,
      [clearExtension(p)]: join('src', p),
    }),
    {},
  )
  await build({
    entryPoints: entries,
    bundle: true,
    minify: false,
    sourcemap: true,
    packages: 'external',
    target: 'node18',
    platform: 'node',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    outdir: 'dist',
    logLevel: 'info',
  })
}

callBuild()
