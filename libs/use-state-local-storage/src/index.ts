import React, { useEffect, useState } from 'react'

export const useStateLocalStorage = <T = any>(
  key: string,
  initValue?: T,
): [T | undefined, React.Dispatch<React.SetStateAction<T | undefined>>] => {
  const [value, setValue] = useState<T | undefined>(initValue)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (key in localStorage) {
      try {
        setValue(JSON.parse(localStorage[key]))
      } catch (err) {}
    }
  }, [key])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (value !== localStorage[key]) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (err) {}
    }
  }, [key, value])

  return [value, setValue]
}
