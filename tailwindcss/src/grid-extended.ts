import plugin from 'tailwindcss/plugin'
import defaultTheme from 'tailwindcss/defaultTheme'
import { createPxComment } from './utils/comment'

export const gridAuto: ReturnType<typeof plugin> = plugin(
  function ({ addUtilities, matchUtilities, theme }) {
    addUtilities({
      '.grid-layer': {
        gridTemplateAreas: "'stack'",
        gridTemplateColumns: '1fr',
        '& > *': {
          gridArea: 'stack',
        },
      },
    })
    matchUtilities(
      {
        'grid-auto-fill': (value) => ({
          gridTemplateColumns:
            `repeat(auto-fill, minmax(min(${value}, 100%), 1fr))` +
            createPxComment(value),
        }),
        'grid-auto-fit': (value) => ({
          gridTemplateColumns:
            `repeat(auto-fit, minmax(min(${value}, 100%), 1fr))` +
            createPxComment(value),
        }),
      },
      { values: { ...theme('gridAutoFill'), ...theme('maxWidth') } },
    )
  },
  {
    theme: {
      gridAutoFill: {
        DEFAULT: '16rem',
        ...defaultTheme.spacing,
      },
    },
  },
)

export default gridAuto
