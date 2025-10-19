import plugin from 'tailwindcss/plugin'
import { createPxComment } from './utils/comment'

export const extendGradientPosition: ReturnType<typeof plugin> = plugin(
  function ({ matchUtilities, theme }) {
    matchUtilities(
      {
        'to-pos': (value) => ({
          '--tw-gradient-to-position': value + createPxComment(value),
        }),
        'from-pos': (value) => ({
          '--tw-gradient-from-position': value + createPxComment(value),
        }),
      },
      { values: theme('width') },
    )
  },
)

export default extendGradientPosition
