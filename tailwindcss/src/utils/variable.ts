import type { Palette } from '../plugins/color-theme'

type ColorVariableArgs<P extends {}> = {
  colors: P
  variants: string[]
  aliases: Record<string, keyof P>
}

export function parseColorVariable<P extends Record<string, Palette>>({
  colors,
  variants,
  aliases,
}: ColorVariableArgs<P>) {
  const res: Record<string, string> = {}

  for (const variant of variants) {
    const colorName = aliases[variant] || variant
    const palette = colors[colorName]

    for (const k in palette) {
      res[`--color-${variant}${k}`] = palette[k]
    }
  }

  return res
}

export function genColorVariable(...labels: string[]) {
  const vars: Record<string, (color: string | Function) => any> = {}

  for (const label of labels) {
    vars[label] = (color: string | Function) => ({
      [`--color-${label}`]:
        typeof color === 'function' ? color({ opacityValue: '1' }) : color,
    })
  }

  return vars
}
