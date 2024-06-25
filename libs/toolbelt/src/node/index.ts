import type { Readable } from 'stream'
import {
  createDeflate,
  createGunzip,
  createGzip,
  createInflate,
  deflate,
  gunzip,
  gzip,
  inflate,
} from 'zlib'
import { Buffer } from 'buffer'

export const extractTokenFromAuthorization = (
  authorization?: string | null,
) => {
  if (!authorization) {
    return null
  }
  if (/^bearer .+/i.test(authorization)) {
    return authorization.substring(7)
  }
  if (/^basic .+/i.test(authorization)) {
    const t = authorization.substring(6)
    return Buffer.from(t, 'base64').toString('utf-8')
  }
  return authorization ?? null
}

export type RequestEncoding = 'gzip' | 'x-gzip' | 'deflate' | 'identity'

/**
 * Decompress buffer with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export async function parseDecompressBuffer(
  data: Buffer,
  encoding: RequestEncoding[] = ['identity'],
) {
  let buffer = data
  for (const enc of encoding) {
    if (/^gzip$/i.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        gunzip(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    } else if (/^deflate$/i.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        inflate(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    }
  }
  return buffer
}

/**
 * Compress buffer with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export async function parseCompressBuffer(
  data: Buffer,
  encoding: RequestEncoding[] = ['identity'],
) {
  let buffer = data
  for (const enc of encoding) {
    if (/^gzip$/i.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        gzip(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    } else if (/^deflate$/i.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        deflate(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    }
  }
  return buffer
}

/**
 * Decompress stream piping with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export async function parseDecompressStream(
  data: Readable,
  encoding: RequestEncoding[] = ['identity'],
) {
  let stream = data
  for (const enc of encoding) {
    if (/^gzip$/i.test(enc)) {
      stream = stream.pipe(createGunzip())
    } else if (/^deflate$/i.test(enc)) {
      stream = stream.pipe(createInflate())
    }
  }
  return stream
}

/**
 * Compress stream piping with gzip and/or deflate encoding
 *
 * @param data
 * @param encoding
 * @returns
 */
export async function parseCompressStream(
  data: Readable,
  encoding: RequestEncoding[] = ['identity'],
) {
  let stream = data
  for (const enc of encoding) {
    if (/^gzip$/i.test(enc)) {
      stream = stream.pipe(createGzip())
    } else if (/^deflate$/i.test(enc)) {
      stream = stream.pipe(createDeflate())
    }
  }
  return stream
}
