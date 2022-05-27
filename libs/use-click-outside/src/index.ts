import { ReactRefs, useForkRef } from '@vulppi/react-use-fork-ref'
import {
  MouseEventHandler,
  PointerEventHandler,
  useLayoutEffect,
  useRef,
} from 'react'

export const useClickOutside = <T extends Element>(
  handler: MouseEventHandler | PointerEventHandler,
  ref: ReactRefs<T>,
) => {
  const validRef = useRef<T>()
  const mainRef = useForkRef<T>(validRef, ref)

  useLayoutEffect(() => {
    const listener = (e: any) => {
      if (
        validRef &&
        validRef.current &&
        !validRef.current.contains(e.target as Element)
      ) {
        handler(e)
      }
    }

    document.addEventListener('click', listener, true)
    document.addEventListener('ontouchstart', listener, true)

    return () => {
      document.removeEventListener('click', listener, true)
      document.removeEventListener('ontouchstart', listener, true)
    }
  }, [handler])

  return mainRef
}
