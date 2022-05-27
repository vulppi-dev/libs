import { useEffect, useState } from 'react'

type MaskDigit = '9' | '0' | 'A' | 'X' | 'a' | 'x'

type MaskResult = [string, string, (value: string) => void] & {
  masked: boolean
  maskedValue: string
  clearValue: string
  setValue: (value: string) => void
}

const maskTypes = {
  A: /[a-z]/,
  a: /[a-z]/,
  X: /[a-z]/,
  x: /[a-z]/,
  0: /[0-9]/,
  9: /[0-9]/,
}

const maskDigitValidation = /a|x|0|9/i
const maskSymbolsValidation = /[^a-z0-9]/gi

const processStringMask = (value: string, masks: string[]) => {
  let validMask = false
  let maskIndex = 0
  let res = ''

  const text = value.replace(maskSymbolsValidation, '')

  for (let mask of masks) {
    if (validMask) break
    const clearMask = mask.replace(maskSymbolsValidation, '')

    if (clearMask.length < text.length) continue

    validMask = true
    maskIndex = 0
    res = ''

    for (let i = 0; i < text.length; i++) {
      const c = text[i]
      const maskDigit = mask[maskIndex]
      if (maskDigitValidation.test(maskDigit)) {
        if (maskTypes[maskDigit as MaskDigit].test(c)) {
          res += c
          maskIndex++
          continue
        } else {
          validMask = false
          break
        }
      } else {
        i--
        res += maskDigit
        maskIndex++
      }
    }
  }
  if (validMask) {
    return {
      rawValue: value,
      clearValue: text,
      maskedValue: res,
      masked: true,
    }
  } else {
    return {
      rawValue: value,
      clearValue: text,
      maskedValue: value,
      masked: false,
    }
  }
}

export const useStringMask = (mask: string | string[], initValue?: string) => {
  const [value, setValue] = useState<[string, string]>(() => {
    if (!initValue) return ['', '']
    const { clearValue, maskedValue } = processStringMask(
      initValue,
      Array.isArray(mask) ? mask : [mask],
    )
    return [clearValue, maskedValue]
  })
  const [masked, setMasked] = useState(false)

  const setPureValue = (value: string) => {
    const { clearValue, maskedValue, masked } = processStringMask(
      value,
      Array.isArray(mask) ? mask : [mask],
    )

    setMasked(masked)
    if (!masked) return

    setValue([clearValue, maskedValue])
  }

  useEffect(() => {
    setPureValue(value[0])
  }, [...(Array.isArray(mask) ? mask : [mask])])

  return Object.assign([...value, setPureValue], {
    clearValue: value[0],
    maskedValue: value[1],
    masked,
    setValue: setPureValue,
  }) as MaskResult
}
