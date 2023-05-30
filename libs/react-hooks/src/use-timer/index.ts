import { useEffect, useState } from 'react'

export interface TimerControl {
  start: VoidFunction
  stop: VoidFunction
  restart: VoidFunction
}

export const useTimer = (
  increment = 2,
  step = 1000,
): [number, TimerControl] => {
  const [value, setValue] = useState(0)
  const [start, setStart] = useState(false)

  useEffect(() => {
    if (!start) return

    const id = setInterval(() => setValue((v) => v + increment), step)

    return () => clearInterval(id)
  }, [start, increment])

  return [
    value,
    {
      start: () => setStart(true),
      stop: () => setStart(false),
      restart: () => {
        setValue(0)
        setStart(true)
      },
    },
  ]
}
