import { useEffect } from 'react'

export const useTimeout = (cb: VoidFunction, timeInMillis = 1000) => {
  useEffect(() => {
    const id = setTimeout(cb, timeInMillis)
    return () => clearTimeout(id)
  }, [])
}
