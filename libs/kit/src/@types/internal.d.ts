declare interface StartApplicationProps {
  config: Vulppi.KitConfig
  basePath: string
}

declare interface CallWorkerProps {
  route: string
  basePath: string
  config: Vulppi.KitConfig
  data: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    query: Record<string, any>
    cookies: Record<string, string>
    headers: import('http').IncomingHttpHeaders
    body: Record<string, any> | string | undefined
    buffer?: Buffer
  }
}
