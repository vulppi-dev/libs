import chroma from 'chroma-js'
import type { Palette } from '../plugins/color-theme'

export type ColorSpaceType =
  | 'rgb'
  | 'hsl'
  | 'hsv'
  | 'lab'
  | 'oklab'
  | 'lch'
  | 'oklch'
  | 'hcl'

type ColorLabelArgs<P extends {}> = {
  label: string
  colors: P
  aliases: Record<string, keyof P>
}

export function genColorLabel<P extends Record<string, Palette>>({
  label,
  aliases,
  colors,
}: ColorLabelArgs<P>) {
  const colorName = aliases[label] || label
  const palette = colors[colorName]

  const res: Record<string, string> = {}

  for (const k in palette) {
    const color = palette[k]
    const preview = normalizeColor(color)

    res[
      `${label}${k}`
    ] = `oklch(from var(--color-${label}${k}) l c h / <alpha-value>) /* ${preview} */`
  }

  return res
}

const COLOR_VALUES =
  /^(?<schema>rgb|hsl|hsv|lab|oklab|lch|oklch|hcl)\((?<a>[0-9.]+%?)[, ] *(?<b>[0-9.]+)[, ] *(?<c>[0-9.]+%?)/

function normalizeColor(color: string) {
  if (color[0] === '#') return color

  const match = COLOR_VALUES.exec(color)

  if (!match?.groups) return color

  const { schema, a, b, c } = match.groups

  const colorSpaceFunc = chroma[schema as ColorSpaceType]
  const chromaColor = colorSpaceFunc(
    normalizeColorValue(a),
    normalizeColorValue(b),
    normalizeColorValue(c),
  )

  return chromaColor.hex('rgb')
}

function normalizeColorValue(value: string) {
  const c = value.trim()
  if (c.endsWith('%')) return parseFloat(c) / 100
  return parseFloat(c)
}
