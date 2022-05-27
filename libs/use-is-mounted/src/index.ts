import { useEffect, useRef } from 'react'

export const useIsMounted = () => {
  const value = useRef<boolean>(false)
  useEffect(() => {
    value.current = true
    return () => {
      value.current = false
    }
  }, [])

  return value
}
