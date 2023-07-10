import ck from 'chalk'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { watch } from 'fs'
import { glob } from 'glob'
import _ from 'lodash'
import { dirname, resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { Worker } from 'worker_threads'
import {
  escapePath,
  globFind,
  globFindAll,
  globFindAllList,
  join,
} from '../utils/path'
import { callBuild } from './_builder'
import { getChecksum } from './_common'
import { normalize } from 'path'

const urlPath = import.meta.url
// Url in dist/commands folder
const basePath = resolve(fileURLToPath(urlPath), '..')
const __dirname = dirname(basePath)

export const command = 'dev'

export const aliases = ['develop']

export const describe = 'Start the development server'

export async function handler(): Promise<void> {
  const projectPath = process.cwd()
  const appFolder =
    (await globFind(projectPath, 'src/app')) ||
    (await globFind(projectPath, 'app')) ||
    'src/app'

  console.log('Starting the application in %s mode...', ck.bold('development'))
  console.log(
    'Application path: %s',
    ck.blue.bold(escapePath(appFolder, projectPath)),
  )

  let configPath = await globFind(projectPath, 'vulppi.config.{mjs,cjs,js}')
  let envPath: string | undefined = await getEnvPath(projectPath)

  let configChecksum = configPath ? await getChecksum(configPath) : ''
  let envChecksum = envPath ? await getChecksum(join(projectPath, envPath)) : ''

  if (!configPath) {
    console.log(ck.red('No config file found. Please create a config file.'))
    console.log(ck.red('You can use the following command:'))
    console.log(ck.yellow.bold('  vulppi init'))
    return
  }

  restartServer(projectPath, configPath, envPath)

  watch(projectPath, async (_, filename) => {
    if (!filename) return
    if (/^vulppi.config.[mc]?js$/.test(filename)) {
      const configFiles = await globFindAll(
        projectPath,
        'vulppi.config.{mjs,cjs,js}',
      )
      if (configFiles.length > 1) {
        console.log(ck.red('Multiple config files found.'))
        console.log(
          ck.red('Please leave one and remove the rest following files:'),
        )
        console.log(
          ck.red(configFiles.map((p) => escapePath(p, projectPath)).join('\n')),
        )
        return
      } else if (!configFiles.length) {
        console.log(ck.red('The config file has removed.'))
        return
      }
      configPath = configFiles[0]
    } else if (/^[a-z-_]*.env(\.[a-z-_]*)?$/) {
      const envFiles = await findEnvPaths(projectPath)
      if (envFiles.length > 1) {
        console.log(ck.red('Multiple env files found.'))
        console.log(
          ck.red('Please leave one and remove the rest following files:'),
        )
        console.log(
          ck.red(envFiles.map((p) => escapePath(p, projectPath)).join('\n')),
        )
        return
      } else if (envPath && !envFiles.length) {
        console.log(ck.red('The env file has removed.'))
      }
      envPath = envFiles[0]
    }
    let changeConfig = false
    let changeEnv = false

    if (configPath) {
      const newConfigChecksum = await getChecksum(join(projectPath, configPath))
      if (configChecksum !== newConfigChecksum) {
        configChecksum = newConfigChecksum
        changeConfig = true
        console.log('Config file changed.')
      }
    }
    if (envPath) {
      const newEnvChecksum = await getChecksum(join(projectPath, envPath))
      if (envChecksum !== newEnvChecksum) {
        envChecksum = newEnvChecksum
        changeEnv = true
        console.log('Env file changed.')
      }
    }
    if (changeConfig || changeEnv) {
      restartServer(projectPath, configPath!, envPath)
    }
  })

  const appFolderChecksum: Map<string, string> = new Map()
  const appFiles = await globFindAll(
    appFolder,
    '**/{route,middleware,validation}.ts',
  )

  appFiles.forEach(async (filename) => {
    const escapedPath = escapePath(filename, appFolder)
    const checksum = await getChecksum(filename)
    appFolderChecksum.set(escapedPath, checksum)
    console.log('Compiling the %s file...', ck.bold.green(escapedPath))
    callBuild({
      input: appFolder,
      output: join(projectPath, '.vulppi', 'app'),
      entries: [escapedPath],
    })
  })

  watch(appFolder, { recursive: true }, async (state, filename) => {
    if (!filename) return
    const normalizedFilename = normalize(filename)

    if (/\/?(route|middleware|validation).ts/.test(normalizedFilename)) {
      const oldChecksum = appFolderChecksum.get(filename)
      const newChecksum = await getChecksum(join(appFolder, filename))
      appFolderChecksum.set(filename, newChecksum)
      if (oldChecksum !== newChecksum) {
        console.log('Compiling the %s file...', ck.bold(filename))
        callBuild({
          input: appFolder,
          output: join(projectPath, '.vulppi', 'app'),
          entries: [filename],
        })
      }
    }
  })
}

let app: Worker | null = null
let debounceApp: NodeJS.Timeout | null = null
async function restartServer(
  projectPath: string,
  configPath: string,
  envPath?: string,
) {
  let first = true
  if (debounceApp) {
    clearTimeout(debounceApp)
    debounceApp = null
  }

  debounceApp = setTimeout(async () => {
    if (app) {
      app.terminate()
      app = null
      first = false
    }

    if (!first) {
      console.log('Restarting the application...')
    } else {
      console.log('Starting the application...')
    }

    const configURL = pathToFileURL(configPath)
    configURL.searchParams.set('update', Date.now().toString())
    const config = await import(configURL.toString()).then(
      (m) => m.default as Vulppi.KitConfig,
    )

    const envObject = Object.assign(
      structuredClone(process.env),
      _.get(config, 'env', {}),
    ) as Record<string, string>
    const myEnv = envPath
      ? dotenv.config({
          path: envPath,
          processEnv: envObject,
          override: true,
        })
      : {
          parsed: envObject,
        }
    dotenvExpand.expand(myEnv)
    app = new Worker(join(__dirname, 'lib', 'worker-app.mjs'), {
      workerData: { config, basePath: projectPath },
      env: envObject,
    })
  }, 1000)
}

async function findEnvPaths(basePath: string) {
  return globFindAllList(
    [basePath, '*.env'],
    [basePath, '.env.*'],
    [basePath, '*.env.*'],
    [basePath, '.env'],
  )
}

async function getEnvPath(basePath: string) {
  return (await findEnvPaths(basePath))[0]
}
