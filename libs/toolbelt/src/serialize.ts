import { Buffer } from 'buffer'
import { deflateSync, inflateSync } from 'zlib'

export const serializeObject = (obj: any): Buffer => {
  return deflateSync(Buffer.from(JSON.stringify(obj)))
}

export const deserializeObject = <R = any>(serial: Buffer): R => {
  return JSON.parse(inflateSync(serial).toString())
}
