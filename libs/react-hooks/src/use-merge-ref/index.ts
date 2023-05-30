import React, { useMemo } from 'react'

export type ReactRefs<T> =
  | React.ForwardedRef<T | undefined | null>
  | React.RefCallback<T | undefined | null>
  | React.MutableRefObject<T | undefined | null>
  | ((ref: T | undefined | null) => Promise<void> | void)
  | undefined
  | null

const setRef = <T = any>(ref: ReactRefs<T>, value: T) => {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref && typeof ref === 'object') {
    ref.current = value
  }
}

export const useMergeRef = <T = any>(...refs: ReactRefs<T>[]) => {
  return useMemo(
    () => (node: T) => refs.forEach((r) => r && setRef<T>(r, node)),
    refs,
  )
}
