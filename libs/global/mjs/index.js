import 'colors'
import Minimist from 'minimist'
import { homedir } from 'os'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
export const omitProps = (obj, ...keys) => {
  const ret = { ...obj }
  for (const key of keys) {
    delete ret[key]
  }
  return ret
}
Object.defineProperty(global, '$dirname', {
  writable: false,
  configurable: false,
  value: dirname(resolve(fileURLToPath(import.meta.url), '..')),
})
Object.defineProperty(global, '$home', {
  writable: false,
  configurable: false,
  value: homedir(),
})
Object.defineProperty(global, '$args', {
  writable: false,
  configurable: false,
  value: Minimist(process.argv.slice(2)),
})
Object.defineProperty(global, '$root', {
  writable: false,
  configurable: false,
  value: process.cwd(),
})
Object.defineProperty(global, 'omit', {
  writable: false,
  configurable: false,
  value: omitProps,
})
