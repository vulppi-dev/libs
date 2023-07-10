import { workerData } from 'worker_threads'
import {
  findMiddlewarePathnames,
  findRoutePathname,
  sendResponse,
} from './router-tools'
import { StatusCodes } from 'http-status-codes'

const { config, basePath, route, data } = workerData as CallWorkerProps
const env = process.env as Record<string, string>

const middlewarePathnames = await findMiddlewarePathnames(basePath)
const routePathname = await findRoutePathname(basePath, route)

if (!routePathname) {
  sendResponse({
    status: StatusCodes.NOT_FOUND,
    data: {
      route,
      routePathname,
      middlewarePathnames,
      message: config.messages?.NOT_FOUND || 'Not found Route',
    },
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

sendResponse({
  status: StatusCodes.OK,
  data: {
    routePathname,
    middlewarePathnames,
  },
  headers: {
    'Content-Type': 'application/json',
  },
})
