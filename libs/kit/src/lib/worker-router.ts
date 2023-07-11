import { workerData } from 'worker_threads'
import {
  findMiddlewarePathnames,
  findRoutePathname,
  findValidatorPathname,
  sendResponse,
} from './router-tools'
import { StatusCodes } from 'http-status-codes'
import { escapePath } from '../utils/path'

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
if (routePathnames.length > 1) {
  sendResponse({
    status: StatusCodes.INTERNAL_SERVER_ERROR,
    data: {
      message: config.messages?.MULTIPLE_ROUTES || 'Multiple routes found',
      details: routePathnames.map((r) => escapePath(r, basePath)),
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

const routePathname = routePathnames[0]
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
