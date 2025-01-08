import { Buffer } from 'buffer'
import type { Readable } from 'stream'
import {
  brotliCompress,
  brotliDecompress,
  createBrotliCompress,
  createBrotliDecompress,
  createDeflate,
  createGunzip,
  createGzip,
  createInflate,
  deflate,
  gunzip,
  gzip,
  inflate,
} from 'zlib'

/**
 * Extracts the token from the Authorization header.
 *
 * @param authorization - The Authorization header value.
 * @returns The extracted token or null if not found.
 */
export function extractTokenFromAuthorization(authorization?: string | null) {
  if (!authorization) {
    return null
  }

  const trimmed = authorization.trim()

  const bearerMatch = trimmed.match(/^Bearer\s+(.+)$/i)
  if (bearerMatch) {
    return {
      type: 'bearer',
      token: bearerMatch[1],
    } as const
  }

  const basicMatch = trimmed.match(/^Basic\s+(.+)$/i)
  if (basicMatch) {
    try {
      const data = Buffer.from(basicMatch[1], 'base64').toString('utf-8')
      const [username, password] = data.split(':')
      return {
        type: 'basic',
        username,
        password,
      } as const
    } catch (_) {
      return null
    }
  }

  return null
}

export type RequestEncoding = 'gzip' | 'x-gzip' | 'deflate' | 'identity' | 'br'

const REGEXP = {
  gzip: /^(?:x-)?gzip$/i,
  deflate: /^deflate$/i,
  identity: /^identity$/i,
  br: /^br$/i,
} as const

/**
 * Decompress buffer
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
    if (REGEXP.identity.test(enc)) {
      continue
    }

    if (REGEXP.gzip.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        gunzip(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    } else if (REGEXP.deflate.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        inflate(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    } else if (REGEXP.br.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        brotliDecompress(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    }
  }
  return buffer
}

/**
 * Compress buffer
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
  for (const enc of encoding.toReversed()) {
    if (REGEXP.identity.test(enc)) {
      continue
    }

    if (REGEXP.gzip.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        gzip(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    } else if (REGEXP.deflate.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        deflate(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    } else if (REGEXP.br.test(enc)) {
      buffer = await new Promise<Buffer>((resolve, reject) => {
        brotliCompress(buffer, (err, res) => {
          if (err) return reject(err)
          resolve(res)
        })
      })
    }
  }
  return buffer
}

/**
 * Decompress stream piping
 *
 * @param data
 * @param encoding
 * @returns
 */
export function parseDecompressStream(
  data: Readable,
  encoding: RequestEncoding[] = ['identity'],
) {
  let stream = data
  for (const enc of encoding) {
    if (REGEXP.identity.test(enc)) {
      continue
    }

    if (REGEXP.gzip.test(enc)) {
      stream = stream.pipe(createGunzip())
    } else if (REGEXP.deflate.test(enc)) {
      stream = stream.pipe(createInflate())
    } else if (REGEXP.br.test(enc)) {
      stream = stream.pipe(createBrotliDecompress())
    }
  }
  return stream
}

/**
 * Compress stream piping
 *
 * @param data
 * @param encoding
 * @returns
 */
export function parseCompressStream(
  data: Readable,
  encoding: RequestEncoding[] = ['identity'],
) {
  let stream = data
  for (const enc of encoding.toReversed()) {
    if (REGEXP.identity.test(enc)) {
      continue
    }

    if (REGEXP.gzip.test(enc)) {
      stream = stream.pipe(createGzip())
    } else if (REGEXP.deflate.test(enc)) {
      stream = stream.pipe(createDeflate())
    } else if (REGEXP.br.test(enc)) {
      stream = stream.pipe(createBrotliCompress())
    }
  }
  return stream
}
