import { useEffect, useState } from 'react'

export const useStateDebounce = <T = undefined>(
  timeInMillis = 1000,
  initial?: T,
): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>] => {
  const [content, setContent] = useState<T | undefined>(initial)
  const [debounceContent, setDebounceContent] = useState<T | undefined>(initial)

  useEffect(() => {
    const id = setTimeout(() => setDebounceContent(content), timeInMillis)
    return () => clearTimeout(id)
  }, [content])

  return [debounceContent, setContent]
}
