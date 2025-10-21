import type { BunPlugin } from 'bun'
import fs from 'fs/promises'
import { glob } from 'glob'
import path from 'path'
import { compile, compileModule, preprocess } from 'svelte/compiler'
import xxhash from 'xxhash-wasm'

const SVELTE_MODULE_EXT = /\.svelte\.(?:t|j)s$/
const SVELTE_COMPONENT = /<[A-Za-z][A-Za-z0-9-]*(?:\s[^>]*?)?>/
const SVELTE_FILE = /\.svelte(?:\.(?:t|j)s)?$/
const SVELTE_CSS = /\?svelte-css$/

const CSS_MAP = new Map<string, string>()

export function buildPlugin(dev = false): BunPlugin {
  return {
    name: 'svelte-plugin',
    setup(build) {
      build.onLoad({ filter: SVELTE_CSS, namespace: 'svelte-css' }, (args) => ({
        contents: CSS_MAP.has(args.path) ? CSS_MAP.get(args.path)! : '',
        loader: 'css',
      }))

      build.onLoad({ filter: SVELTE_FILE }, async (args) => {
        const source = await fs.readFile(args.path, 'utf8')

        const is_module =
          !SVELTE_COMPONENT.test(source) || SVELTE_MODULE_EXT.test(args.path)

        const preprocessed = await preprocess(source, [], {
          filename: args.path,
        })

        try {
          let compiled
          if (is_module) {
            compiled = compileModule(preprocessed.code, {
              filename: path.basename(args.path),
              generate: 'client',
              dev,
            })
          } else {
            compiled = compile(preprocessed.code, {
              filename: path.basename(args.path),
              css: 'external',
              generate: 'client',
              dev,
              hmr: dev,
              preserveComments: dev,
            })
          }

          const js = compiled.js.code
          const css = compiled.css?.code

          // Se houver CSS, cria um módulo virtual para ele
          let contents = js
          if (css) {
            const { h32 } = await xxhash()
            const cssVirtualPath = `${h32(args.path)}?svelte-css`
            CSS_MAP.set(cssVirtualPath, css)
            // Importa o CSS no JS gerado
            contents = `import "${cssVirtualPath}";\n${js}`
          }

          return {
            contents,
            loader: 'js',
            resolveDir: path.dirname(args.path),
          }
        } catch (e) {
          console.error('Error compiling svelte module:', e)
        }
      })

      build.onResolve({ filter: SVELTE_CSS }, (args) => ({
        path: args.path,
        namespace: 'svelte-css',
      }))

      build.onResolve({ filter: /^[^.$]/, namespace: 'file' }, async (args) => {
        try {
          if (/^(?:[\/\\.]|[a-zA-Z]+:)/.test(args.path)) return
          if (!SVELTE_FILE.test(args.importer)) return

          let package_glob_path = ''
          let rest_path: string[] = []

          if (/^@/.test(args.path)) {
            const [scope, base, ...rest] = args.path.split('/') as [
              string,
              string,
              ...string[],
            ]
            package_glob_path = path.join(
              process.cwd(),
              'node_modules',
              scope,
              base,
              '**',
              'package.json',
            )
            rest_path = rest
          } else {
            const [base, ...rest] = args.path.split('/') as [
              string,
              ...string[],
            ]
            package_glob_path = path.join(
              'node_modules',
              base,
              '**',
              'package.json',
            )
            rest_path = rest
          }

          const [package_path] = await glob(
            package_glob_path.replace(/\\/g, '/'),
            {
              nodir: true,
              absolute: true,
            },
          )

          if (!(package_path && (await fs.exists(package_path)))) {
            return
          }

          const package_source = await fs.readFile(package_path, 'utf8')
          const package_json = JSON.parse(package_source)

          const module_path =
            rest_path.length > 0
              ? package_json.exports?.[['.', ...rest_path].join('/')]?.svelte
              : package_json.svelte || package_json.exports?.['.']?.svelte

          if (!module_path) return

          return {
            path: path.join(path.dirname(package_path), module_path),
            namespace: 'file',
          }
        } catch (e) {
          return
        }
      })
    },
  }
}
