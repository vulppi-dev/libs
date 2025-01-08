import { createPxComment } from '@/utils/comment'
import plugin from 'tailwindcss/plugin'

export const extendGradientPosition = plugin(function ({
  matchUtilities,
  theme,
}) {
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
})
