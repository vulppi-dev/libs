import {
  useLayoutEffect,
  useRef,
  type MouseEventHandler,
  type PointerEventHandler,
} from 'react'
import { useMergeRef, type ReactRefs } from '../use-merge-ref'

export const useClickOutside = <T extends Element>(
  handler: MouseEventHandler | PointerEventHandler,
  ref: ReactRefs<T>,
) => {
  const validRef = useRef<T>()
  const mainRef = useMergeRef<T>(validRef, ref)

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
