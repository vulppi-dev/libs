import { deflate, inflate } from 'pako'

export function serializeObject(obj: any) {
  return deflate(JSON.stringify(obj))
}

export function deserializeObject<R = any>(serial: ArrayBuffer): R {
  return JSON.parse(inflate(serial, { to: 'string' }).toString())
}
