import React, { useMemo } from 'react'

type ReactRefs<T> =
  | React.ForwardedRef<T | undefined | null>
  | React.RefCallback<T | undefined | null>
  | React.MutableRefObject<T | undefined | null>
  | undefined
  | null

const setRef = <T extends Element>(ref: ReactRefs<T>, value: T) => {
  if (typeof ref === 'function') {
    ref(value)
  } else if (ref && typeof ref === 'object') {
    ref.current = value
  }
}

export const useForkRef = <T extends Element>(...refs: ReactRefs<T>[]) => {
  return useMemo(
    () => (node: T) => refs.forEach((r) => r && setRef<T>(r, node)),
    refs,
  )
}
