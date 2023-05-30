import { useState } from 'react'

export const useRerender = () => {
  const [, setValue] = useState(false)
  return () => setValue((e) => !e)
}
