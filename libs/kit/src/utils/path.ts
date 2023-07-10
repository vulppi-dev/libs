import { glob } from 'glob'
import path, { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

export function getDirname() {
  const urlPath = import.meta.url
  // Url in dist/lib folder
  const basePath = resolve(fileURLToPath(urlPath))
  return dirname(basePath)
}

export function join(...paths: string[]) {
  return normalizePath(path.join(...paths))
}

export async function globFind(
  ...pattern: string[]
): Promise<string | undefined> {
  const res = await glob(join(...pattern), {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true,
  })
  return normalizePath(res[0])
}

export async function globFindAll(...pattern: string[]): Promise<string[]> {
  const res = await glob(join(...pattern), {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true,
  })
  return res.map(normalizePath)
}

export async function globFindAllList(
  ...pattern: string[][]
): Promise<string[]> {
  const res = await glob(join(...pattern.map((p) => join(...p))), {
    ignore: ['**/node_modules/**'],
    windowsPathsNoEscape: true,
  })
  return res.map(normalizePath)
}

export function escapePath(path: string, escape: string) {
  return normalizePath(path)
    .replace(normalizePath(escape), '')
    .replace(/^\//, '')
}

export function normalizePath(path: string) {
  return path.replace(/[\\\/]+/g, '/').replace(/^[\/\\]*/, '')
}

export function clearExtension(path: string) {
  return normalizePath(path).replace(/\.[a-z0-9]+$/, '')
}
