import { useEffect } from 'react'

export const useDebounce = (
  cb: VoidFunction,
  timeInMillis: number,
  dependencies: any[],
) => {
  useEffect(() => {
    const id = setTimeout(cb, timeInMillis)
    return () => clearTimeout(id)
  }, dependencies)
}
