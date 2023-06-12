export const HEADER_KEY = 'x-vulppi-client'
export const HEADER_VALUE = 'vulppi-datasync-client'

const idChars = 'abcdefghijklmnopqrstuvwxyz0123456789'

/**
 * Generate a random GUID.
 */
export function genGUID(size: number = 20) {
  let id = ''
  for (let i = 0; i < size; i++) {
    id += idChars[Math.floor(Math.random() * idChars.length)]
  }
  return id
}

export function clearOptions(opt: any) {
  delete opt.port
  delete opt.noServer
}

export function safeGetMap<K extends any, V extends any, M extends Map<K, V>>(
  key: K,
  map: M,
  create: () => V,
) {
  if (!map.has(key) || map.get(key) === undefined) {
    map.set(key, create())
  }
  return map.get(key) as V
}

export interface ValidationData {
  /**
   * The query params is loaded.
   */
  params: URLSearchParams
  /**
   * The cookies is loaded.
   */
  cookies: Record<string, string>
  /**
   * The cookies is loaded.
   */
  protocols: string[]
}

export type DataKey = `${string}:${string}:${string}`

export interface CommandData {
  command: string
  agent: 'server' | 'client' | 'anonymous'
  key: DataKey
  data?: Record<string, any>
}

export type ValidationFunction = (
  data: ValidationData,
) => Promise<UserContext | undefined> | UserContext | undefined

export type UserContext = {
  id: string
  name: string
  [key: string]: any
}

export type Operations =
  | [op: 'set', path: string[], before: any, after: any]
  | [op: 'delete', path: string[], after: any]
