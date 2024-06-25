type UnionFunctionWithArgsType<Args extends any[] = any[]> = [
  (...args: Args) => {},
  ...Args,
]
type UnionFunctionType =
  | VoidFunction
  | UnionFunctionWithArgsType
  | undefined
  | null

export const unionSerialFunctions =
  (...fns: UnionFunctionType[]) =>
  () => {
    for (const fn of fns) {
      if (Array.isArray(fn)) {
        const rfn: (typeof fn)[0] = fn.shift()

        rfn(...(fn as Array<(typeof fn)[1]>))
      } else {
        fn && fn()
      }
    }
  }

export const promiseDelay = (ms: number) =>
  new Promise<never>((resolve) => setTimeout(resolve, ms))

export function clone<E extends any>(obj: E) {
  if (typeof structuredClone !== 'function') {
    return JSON.parse(JSON.stringify(obj)) as E
  } else {
    return structuredClone(obj)
  }
}

export function omitShallowProps<P extends object, K extends keyof P>(
  obj: P,
  ...keys: K[]
) {
  const ret = clone(obj)
  for (const key of keys) {
    delete ret[key]
  }
  return ret as Omit<P, K>
}

export function tryCatchCallback<R extends Function>(run: R, cbErr: any) {
  try {
    return run()
  } catch (err) {
    console.error(err)
    cbErr && cbErr(err)
  }
}

export function omitNullables<R extends object>(obj: R): R {
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj))
    return obj.filter((v) => v != null).map(omitNullables) as R

  const result: Record<string, any> = {}
  for (const key in obj) {
    const value = obj[key]
    if (value != null) {
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          result[key] = value.filter((v) => v != null).map(omitNullables)
        } else {
          result[key] = omitNullables(value)
        }
      } else {
        result[key] = value
      }
    }
  }
  return result as R
}
