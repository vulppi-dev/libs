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

export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) {
    return true
  }
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2
  }
  if (typeof obj1 !== typeof obj2) {
    return false
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false
    }
  }

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (const key of keys1) {
    if (!keys2.includes(key)) {
      return false
    }

    const val1 = obj1[key]
    const val2 = obj2[key]

    if (!deepEqual(val1, val2)) {
      return false
    }
  }
  return true
}

export type DataKey = `${string}:${string}:${string}`

export interface CommandData {
  command: string
  agent: 'server' | 'client' | 'anonymous'
  key: DataKey
  data?: Record<string, any>
}

export type Operations =
  | [op: 'set', path: string[], before: any, after: any]
  | [op: 'delete', path: string[], after: any]
