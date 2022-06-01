'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.omitProps = void 0
require('colors')
const minimist_1 = __importDefault(require('minimist'))
const os_1 = require('os')
const path_1 = require('path')
const omitProps = (obj, ...keys) => {
  const ret = { ...obj }
  for (const key of keys) {
    delete ret[key]
  }
  return ret
}
exports.omitProps = omitProps
Object.defineProperty(global, '$dirname', {
  writable: false,
  configurable: false,
  value: (0, path_1.dirname)((0, path_1.resolve)(__dirname, '..')),
})
Object.defineProperty(global, '$home', {
  writable: false,
  configurable: false,
  value: (0, os_1.homedir)(),
})
Object.defineProperty(global, '$args', {
  writable: false,
  configurable: false,
  value: (0, minimist_1.default)(process.argv.slice(2)),
})
Object.defineProperty(global, '$root', {
  writable: false,
  configurable: false,
  value: process.cwd(),
})
Object.defineProperty(global, 'omit', {
  writable: false,
  configurable: false,
  value: exports.omitProps,
})
