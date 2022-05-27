import { ReactRefs, useForkRef } from '@vulppi/react-use-fork-ref'
import imask, { AnyMaskedOptions } from 'imask'
import { useEffect, useState } from 'react'

export const useIMask = <T extends HTMLElement>(
  opt: AnyMaskedOptions,
  ref?: ReactRefs<T>,
) => {
  const [node, setNode] = useState<T | null>()
  const mainRef = useForkRef((n) => setNode(n), ref)

  useEffect(() => {
    if (!node) return

    const im = imask(node, opt)
    return () => {
      im.destroy()
    }
  }, [node])

  return mainRef
}
