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
        const rfn: typeof fn[0] = fn.shift()

        rfn(...(fn as Array<typeof fn[1]>))
      } else {
        fn && fn()
      }
    }
  }

export const promiseDelay = (ms: number) =>
  new Promise<never>((resolve) => setTimeout(resolve, ms))

export const omitShallowProps = <
  P extends Object = any,
  K extends string = any,
>(
  obj: P,
  ...keys: K[]
) => {
  const ret = { ...obj } as Omit<P, K>
  for (const key of keys) {
    // @ts-ignore
    delete ret[key]
  }
  return ret
}

export const tryCatchCallback = <R extends Function>(run: R, cbErr: any) => {
  try {
    return run()
  } catch (err) {
    console.error(err)
    cbErr && cbErr(err)
  }
}

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

export const omitNullables = <R extends any = any>(obj: R): R => {
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj))
    return obj.map(omitNullables).filter((v) => v != null) as R

  const result: any = {}
  for (const key in obj) {
    if (obj[key] != null) {
      if (typeof obj[key] === 'object') {
        if (Array.isArray(obj[key])) {
          // @ts-ignore
          result[key] = obj[key].map(omitNullables).filter((v) => v != null)
        } else {
          result[key] = omitNullables(obj[key])
        }
      } else {
        result[key] = obj[key]
      }
    }
  }
  return result as R
}
