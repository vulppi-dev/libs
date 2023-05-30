import { useEffect, useState } from 'react'

export const useMediaQuery = (query: string) => {
  const [value, setValue] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setValue(false)
      return
    }

    const mql = window.matchMedia(query)
    setValue(mql.matches)
    const handleChange = (ev: MediaQueryListEvent) => {
      setValue(ev.matches)
    }
    mql.addEventListener('change', handleChange)

    return () => {
      mql.removeEventListener('change', handleChange)
    }
  }, [query])

  return value
}
