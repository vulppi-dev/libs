import plugin from 'tailwindcss/plugin'
import type { CSSRuleObject } from 'tailwindcss/types/config'
import { genColorLabel } from '../utils/label'
import { genColorVariable, parseColorVariable } from '../utils/variable'

export type Palette = Record<string, string>

type ThemeColors<C extends Record<string, Palette>> = {
  colors: C
  colorsAlt?: C
  colorAliases?: Record<string, keyof C>
  strategy?: 'dark' | 'light'
}

type AddBaseStyleArgs = {
  strategy: 'dark' | 'light'
  hasAltColors?: boolean
  addBase: (base: CSSRuleObject) => void
}

const baseColorsDark = {
  '--color-screen': 'theme(colors.black)',
  '--color-screen-text': 'theme(colors.white)',
}

const baseColorsLight = {
  '--color-screen': 'theme(colors.white)',
  '--color-screen-text': 'theme(colors.black)',
}

function addBaseStyle({
  strategy,
  hasAltColors = false,
  addBase,
}: AddBaseStyleArgs) {
  const baseColors = strategy === 'dark' ? baseColorsDark : baseColorsLight
  const baseColorsReverse =
    strategy !== 'dark' ? baseColorsDark : baseColorsLight
  const colorScheme = strategy === 'dark' ? 'light' : 'dark'

  addBase({
    ':root': baseColors,
  })

  if (hasAltColors) {
    addBase({
      ':root': {
        [`&:has([data-color-scheme]>:checked[value=${colorScheme}])`]:
          baseColorsReverse,
        [`@media (prefers-color-scheme: ${colorScheme})`]: {
          '&:not(:has([data-color-scheme])), &:has([data-color-scheme]>:checked:not(:is([value=dark],[value=light])))':
            baseColorsReverse,
        },
      },
    })
  }
}

export function createThemeColors<C extends Record<string, Palette>>({
  colors,
  colorsAlt,
  colorAliases = {},
  strategy = 'light',
}: ThemeColors<C>) {
  const colorVariants = [...Object.keys(colors), ...Object.keys(colorAliases)]
  const colorVariables = parseColorVariable({
    colors,
    variants: colorVariants,
    aliases: colorAliases,
  })
  const colorVariablesAlt =
    colorsAlt &&
    parseColorVariable({
      colors: colorsAlt,
      variants: colorVariants,
      aliases: colorAliases,
    })

  const resultColors: Record<string, string> = {
    white: '#fff',
    black: '#000',
    transparent: 'transparent',
    current: 'currentColor',
  }

  colorVariants.forEach((variant) => {
    Object.assign(
      resultColors,
      genColorLabel({
        label: variant,
        colors,
        aliases: colorAliases,
      }),
    )
  })

  return plugin(
    ({ matchUtilities, addBase, theme }) => {
      matchUtilities(
        {
          ...genColorVariable(
            'var-display',
            'var-label',
            'var-body',
            'var-border',
            'var-bg',
            'var-root',
          ),
        },
        {
          values: theme('colors'),
          type: 'color',
        },
      )

      addBaseStyle({
        strategy,
        addBase,
        hasAltColors: !!colorsAlt,
      })

      addBase({
        ':root': {
          ...colorVariables,
        },
      })

      if (colorVariablesAlt) {
        const colorScheme = strategy === 'dark' ? 'light' : 'dark'

        addBase({
          ':root': {
            [`&:has([data-color-scheme]>:checked[value=${colorScheme}])`]: {
              ...colorVariablesAlt,
            },
            [`@media (prefers-color-scheme: ${colorScheme})`]: {
              '&:not(:has([data-color-scheme])), &:has([data-color-scheme]>:checked:not(:is([value=dark],[value=light])))':
                {
                  ...colorVariablesAlt,
                },
            },
          },
        })
      }
    },
    {
      theme: {
        colors: resultColors,
        extend: {
          colors: {
            screen:
              'color(from var(--color-screen) display-p3 r g b / <alpha-value>)',
            'screen-text':
              'color(from var(--color-screen-text) display-p3 r g b / <alpha-value>)',

            'var-display': 'var(--color-var-display)',
            'var-label': 'var(--color-var-label)',
            'var-body': 'var(--color-var-body)',
            'var-border': 'var(--color-var-border)',
            'var-bg': 'var(--color-var-bg)',
            'var-root': 'var(--color-var-root)',
          },
        },
      },
    },
  )
}
