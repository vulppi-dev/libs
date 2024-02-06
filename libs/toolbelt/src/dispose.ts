export type Disposable = {
  [Symbol.dispose]: () => void | Promise<void>
}

export async function using<
  S extends () => R | Promise<R>,
  R extends Disposable,
>(
  start: S,
  options?: {
    end?: () => void | Promise<void>
    error?: (err: any) => void | Promise<void>
  },
): Promise<R> {
  let disposable: R | null = null
  try {
    disposable = await start()
    return disposable
  } catch (err: any) {
    await options?.error?.(err)
    throw err
  } finally {
    if (disposable) {
      await disposable[Symbol.dispose]()
    }
    await options?.end?.()
  }
}

export function usingSync<S extends () => R, R extends Disposable>(
  start: S,
  options?: {
    end?: () => void
    error?: (err: any) => void
  },
): R {
  let disposable: R | null = null
  try {
    disposable = start()
    return disposable
  } finally {
    if (disposable) {
      disposable[Symbol.dispose]()
    }
    options?.end?.()
  }
}
