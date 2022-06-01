const { copyFileSync } = require('fs')
const { resolve, join } = require('path')

const basePath = resolve(__dirname, '..')
const projectPath = process.cwd()

copyFileSync(
  join(basePath, 'templates', 'package.cjs.json'),
  join(projectPath, 'dist', 'package.json'),
)
copyFileSync(
  join(basePath, 'templates', 'package.mjs.json'),
  join(projectPath, 'esm', 'package.json'),
)
