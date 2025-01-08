import { deflate, inflate } from 'pako'

export function serializeObject(obj: any) {
  return deflate(JSON.stringify(obj))
}

export function deserializeObject<R = any>(serial: ArrayBuffer): R {
  return JSON.parse(inflate(serial, { to: 'string' }).toString())
}

/**
 * Asynchronously reads a response body in chunks and tracks download progress.
 *
 * @example
 * ```
 * const response = await fetch('https://example.com/large-text-file');
 * for await (const { chunk, progress } of progressResponse(response)) {
 *   console.log(`Progresso: ${(progress * 100).toFixed(2)}%`);
 *   console.log('Chunk recebido:', chunk);
 * }
 * ```
 */
export async function* progressResponse(res: Response) {
  if (!res.body) return

  const total = parseInt(res.headers.get('content-length') || '0', 10)
  const decoder = new TextDecoder()
  let receivedLength = 0
  const stream = res.body

  // Helper function to create an asynchronous iterator for ReadableStream in browsers
  async function* streamAsyncIterator(stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) yield value
      }
    } finally {
      reader.releaseLock()
    }
  }

  // Choose the correct iterator based on the environment
  const iterator = stream[Symbol.asyncIterator]
    ? stream[Symbol.asyncIterator]() // Node.js environment
    : streamAsyncIterator(stream) // Browser environment

  try {
    for await (const chunk of iterator) {
      const chunkString = decoder.decode(chunk, { stream: true })
      receivedLength += chunk.byteLength
      const progress = total ? receivedLength / total : -1
      yield { chunk: chunkString, progress }
    }
  } catch (error) {
    console.error('Error reading stream:', error)
    throw error
  } finally {
    const chunkString = decoder.decode()
    if (chunkString) {
      yield { chunk: chunkString, progress: 1 }
    }
  }
}
