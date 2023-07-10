import { workerData, parentPort } from 'worker_threads'
import { StatusCodes } from 'http-status-codes'
import { glob } from 'glob'
import { join } from '../utils/path'

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

export async function findMiddlewarePathnames(basePath: string) {
  return await glob(join(basePath, '.vulppi', 'app', '**/middleware.mjs'))
}

export async function findRoutePathname(basePath: string, route: string) {
  const safeRoute = route.replace(/^[\/\\]*/, '').replace(/[\/\\]*$/, '')
  const globSearch = join(basePath, '.vulppi', 'app', '**/route.mjs')
  console.log({ globSearch })
  const routes = await glob(globSearch)
  return routes.find((route) => {
    const r = route
      .replace(/[\/\\]?([a-z0-1]+)/gi, '')
      .replace(/route\.mjs$/, '')
    console.log(r, safeRoute)
    return r === safeRoute
  })
}
