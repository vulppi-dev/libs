import { dirname } from 'path'
import { parentPort } from 'worker_threads'
import {
  escapePath,
  globFind,
  globFindAll,
  globFindAllList,
  join,
  normalizePath,
} from '../utils/path'

// type RequestBaseShape = {
//   method: string
//   body: Record<string, any>
//   query: Record<string, any>
//   headers: Record<string, string>
//   cookies: Record<string, string>
//   custom?: Record<string, any>
//   files?: Record<string, Express.Multer.File> | Express.Multer.File[]
// }

// export function getRequest<Z extends z.ZodType | undefined = undefined>(
//   schema?: Z,
// ): Z extends z.ZodType ? z.infer<Z> : RequestBaseShape {
//   if (!schema) return workerData || {}

//   const parsed = schema.safeParse(workerData || {})
//   if (!parsed.success) {
//     sendResponse(
//       {
//         message: parsed.error.message,
//         details: parsed.error.formErrors.fieldErrors,
//       },
//       {
//         status: StatusCodes.BAD_REQUEST,
//       },
//     )
//   }
//   return parsed.data as any
// }

// export function sendPermanentRedirect(location: string): never {
//   sendResponse(null, {
//     status: StatusCodes.PERMANENT_REDIRECT,
//     headers: {
//       Location: location,
//     },
//   })
// }

// export function sendTemporaryRedirect(location: string): never {
//   sendResponse(null, {
//     status: StatusCodes.TEMPORARY_REDIRECT,
//     headers: {
//       Location: location,
//     },
//   })
// }

export function sendResponse(res: Vulppi.ResponseMessage): never {
  parentPort?.postMessage(res)
  return process.exit(0)
}

export async function findMiddlewarePathnames(
  basePath: string,
  routeFilePath: string,
) {
  const dir = dirname(
    escapePath(routeFilePath, join(basePath, '.vulppi', 'app')),
  )
  const directories = recursiveDirectoryList(dir)
  const searchList = directories.map((r) =>
    [basePath, '.vulppi', 'app', r, 'middleware.mjs'].filter(Boolean),
  )

  return await globFindAllList(...searchList)
}

export async function findValidatorPathname(routeFilePath: string) {
  return await globFind(dirname(routeFilePath), 'validation.mjs')
}

export async function findRoutePathname(basePath: string, route: string) {
  const routesPathnames = await globFindAll(
    basePath,
    '.vulppi',
    'app',
    '**/route.mjs',
  )
  const routes = routesPathnames.map((r) => {
    const escapedRoute = escapePath(r, join(basePath, '.vulppi', 'app'))
    return escapedRoute
      .replace(/[\/\\]?\([a-z0-1]+\)/gi, '')
      .replace(/route\.mjs$/, '')
      .replace(/\/*$/, '')
      .replace(/^\/*/, '/')
  })
  const indexes = routes.map((r, i) => (r === route ? i : -1))
  return routesPathnames
    .map((r, i) => (indexes[i] >= 0 ? r : null))
    .filter(Boolean) as string[]
}

export function recursiveDirectoryList(path: string) {
  const dirs = normalizePath(path)
    .split('/')
    .map((_, i, arr) => arr.slice(0, i + 1).join('/'))
  if (!dirs.includes('')) dirs.unshift('')
  return dirs
}
