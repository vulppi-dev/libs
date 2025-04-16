import type { BunPlugin } from 'bun'
import fs from 'fs/promises'
import { glob } from 'glob'
import path from 'path'
import { compile, compileModule, preprocess } from 'svelte/compiler'
import xxhash from 'xxhash-wasm'

const SVELTE_MODULE = /\.svelte\.(?:t|j)s$/
const SVELTE_FILE = /\.svelte(?:\.(?:t|j)s)?$/
const SVELTE_CSS = /\?svelte-css$/

const CSS_MAP = new Map<string, string>()

export default {
  name: 'svelte-plugin',
  setup(build) {
    build.onLoad(
      { filter: SVELTE_CSS, namespace: 'svelte-css' },
      ({ path }) => ({
        contents: CSS_MAP.has(path) ? CSS_MAP.get(path)! : '',
        loader: 'css',
      }),
    )

    build.onLoad({ filter: SVELTE_FILE }, async (args) => {
      const source = await fs.readFile(args.path, 'utf8')

      // Suporte a pré-processamento (opcional, mas importante para scss, etc.)
      const preprocessed = await preprocess(source, [], {
        filename: args.path,
      })

      const is_module = SVELTE_MODULE.test(args.path)

      const compiled = is_module
        ? compileModule(preprocessed.code, {
            filename: args.path,
            generate: 'client',
          })
        : compile(preprocessed.code, {
            filename: args.path,
            css: 'external',
            generate: 'client',
          })

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
    })

    build.onResolve({ filter: SVELTE_CSS }, ({ path }) => ({
      path: path,
      namespace: 'svelte-css',
    }))

    build.onResolve({ filter: /^[^.$]/, namespace: 'file' }, async (args) => {
      try {
        if (/^(?:[\/\\.]|[a-zA-Z]+:)/.test(args.path)) return

        let package_glob_path = ''
        let rest_path: string[] = []

        if (/^@/.test(args.path)) {
          const [scope, base, ...rest] = args.path.split('/')
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
          const [base, ...rest] = args.path.split('/')
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

        if (!(await fs.exists(package_path))) {
          return
        }

        const package_source = await fs.readFile(package_path, 'utf8')
        const package_json = JSON.parse(package_source)

        const module_path = path.join(
          path.dirname(package_path),
          rest_path.length > 0
            ? package_json.exports?.[['.', ...rest_path].join('/')]?.svelte
            : package_json.svelte || package_json.exports?.['.']?.svelte,
        )
        if (!module_path) return

        return {
          path: module_path,
          namespace: 'file',
        }
      } catch (e) {
        return
      }
    })
  },
} as BunPlugin
