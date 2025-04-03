import type { BunPlugin } from 'bun'
import fs from 'fs/promises'
import path from 'path'
import { compile, compileModule, preprocess } from 'svelte/compiler'
import { fileURLToPath } from 'url'
import xxhash from 'xxhash-wasm'

const dev = process.env.NODE_ENV !== 'production'

const SVELTE_RUNES = /\.svelte(\.ts|\.js)$/
const SVELTE_FILE = /\.svelte(\.ts|\.js)?$/
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

      const compiled = SVELTE_RUNES.test(args.path)
        ? compileModule(preprocessed.code, {
            filename: args.path,
            generate: 'client',
          })
        : compile(preprocessed.code, {
            filename: args.path,
            css: 'external',
            generate: 'client',
            hmr: dev,
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
        import.meta.resolve(args.path)
        return
      } catch (e) {
        const package_path = fileURLToPath(
          import.meta.resolve(path.join(args.path, 'package.json')),
        )
        const package_source = await fs.readFile(package_path, 'utf8')
        const package_json = JSON.parse(package_source)

        const module_path = path.join(
          path.dirname(package_path),
          package_json.svelte || package_json.exports?.['.']?.svelte,
        )

        return {
          path: module_path,
          namespace: 'file',
        }
      }
    })
  },
} as BunPlugin
