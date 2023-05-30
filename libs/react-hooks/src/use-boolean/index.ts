import React, { useState } from 'react'

export interface BooleanControl {
  on: VoidFunction
  off: VoidFunction
  toggle: VoidFunction
  set: React.Dispatch<React.SetStateAction<boolean>>
}

export const useBoolean = (initial = false): [boolean, BooleanControl] => {
  const [value, setValue] = useState<boolean>(initial)

  return [
    value,
    {
      on: () => setValue(true),
      off: () => setValue(false),
      toggle: () => setValue((v) => !v),
      set: setValue,
    },
  ]
}
