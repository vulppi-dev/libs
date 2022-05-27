import { useEffect } from 'react'

export const useInterval = (cb: VoidFunction, timeInMillis = 1000) => {
  useEffect(() => {
    const id = setInterval(cb, timeInMillis)
    return () => clearInterval(id)
  }, [])
}
