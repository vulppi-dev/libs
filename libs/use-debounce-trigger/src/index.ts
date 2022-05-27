import { useEffect, useState } from 'react'

export const useDebounceTrigger = (
  cb: VoidFunction,
  timeInMillis: number = 1000,
) => {
  const [change, setChange] = useState<boolean>(false)

  useEffect(() => {
    const id = setTimeout(cb, timeInMillis)
    return () => clearTimeout(id)
  }, [change])

  return () => setChange((v) => !v)
}
