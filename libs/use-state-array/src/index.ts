import { useState } from 'react'

export interface StateArrayControl<T extends any = any> {
  push: (...values: T[]) => void
  remove: (start: number, size?: number) => void
  clear: (replace?: T[]) => void
  set: (index: number, value: T) => void
  splice: (index: number, length: number, ...value: T[]) => void
  filter: (f: (value: T, index: number, list: T[]) => boolean) => void
}

export const useStateArray = <T extends any = undefined>(
  initial?: T[],
): [T[], StateArrayControl<T>] => {
  const [array, setArray] = useState<T[]>(initial || [])

  return [
    array,
    {
      push: (...values) => {
        setArray((l) => [...l, ...values])
      },
      remove: (start, size = 1) => {
        setArray((l) => {
          l.splice(start, size)
          return [...l]
        })
      },
      clear: (replace) => {
        setArray(Array.isArray(replace) ? replace : [])
      },
      set: (index, value) => {
        setArray((l) => {
          l.splice(index, 1, value)
          return [...l]
        })
      },
      splice: (index, length, ...values) => {
        setArray((l) => {
          l.splice(index, length, ...values)
          return [...l]
        })
      },
      filter: (filter) => {
        setArray((l) => {
          const fl = l.filter(filter)
          return [...fl]
        })
      },
    } as StateArrayControl<T>,
  ]
}
