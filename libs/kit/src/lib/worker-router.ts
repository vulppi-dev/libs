import { workerData } from 'worker_threads'
import {
  findMiddlewarePathnames,
  findRoutePathname,
  findValidatorPathname,
  sendResponse,
} from './router-tools'
import { StatusCodes } from 'http-status-codes'
import { escapePath } from '../utils/path'
import { pathToFileURL } from 'url'

const { config, basePath, route, data } = workerData as CallWorkerProps
const env = process.env as Record<string, string>

const routePathnames = await findRoutePathname(basePath, route)

if (!routePathnames.length) {
  sendResponse({
    status: StatusCodes.NOT_FOUND,
    data: {
      message: config.messages?.NOT_FOUND || 'Not found Route',
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

const method = data.method?.toUpperCase() || 'GET'
const routeModules = await Promise.all(
  routePathnames.map(async (r) => ({
    module: await import(pathToFileURL(r).toString()),
    path: r,
  })),
)
const routeFiltered = routeModules.filter(
  (r) => !!(r.module[method] || r.module.default?.[method]),
)
const countRouteMethods = routeFiltered.reduce<number>(
  (acc, handler) => (handler ? acc + 1 : acc),
  0,
)

if (countRouteMethods > 1) {
  sendResponse({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    data: {
      message: config.messages?.MULTIPLE_ROUTES || 'Multiple routes found',
      details: routeFiltered.map((r) => escapePath(r.path, basePath)),
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

if (!countRouteMethods) {
  sendResponse({
    status: StatusCodes.METHOD_NOT_ALLOWED,
    data: {
      message: config.messages?.METHOD_NOT_ALLOWED || 'Method not allowed',
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

const { module: routeModule, path: routePathname } = routeModules.find(
  (r) => !!(r.module[method] || r.module.default?.[method]),
)!
const validationPathname = await findValidatorPathname(routePathname)
const middlewarePathnames = await findMiddlewarePathnames(
  basePath,
  routePathname,
)

sendResponse({
  status: StatusCodes.OK,
  data: {
    route,
    routePathname,
    validationPathname,
    middlewarePathnames,
  },
  headers: {
    'Content-Type': 'application/json',
  },
})
