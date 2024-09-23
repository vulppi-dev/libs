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

/**
 * Extracts the token from the Authorization header.
 *
 * @param {string | null} authorization - The Authorization header value.
 * @returns {string | null} The extracted token or null if not found.
 */
export function extractTokenFromAuthorization(authorization?: string | null) {
  if (!authorization) {
    return null
  }

  const trimmed = authorization.trim()

  const bearerMatch = trimmed.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch) {
    return bearerMatch[1]
  }

  const basicMatch = trimmed.match(/^Basic\s+(.+)$/i)
  if (basicMatch) {
    try {
      return Buffer.from(basicMatch[1], 'base64').toString('utf-8')
    } catch (_) {
      return null
    }
  }

  return null
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
