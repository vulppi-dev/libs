import { deflate, inflate } from 'pako'

export const serializeObject = (obj: any) => {
  return deflate(JSON.stringify(obj))
}

export const deserializeObject = <R = any>(serial: ArrayBuffer): R => {
  return JSON.parse(inflate(serial, { to: 'string' }).toString())
}
