import plugin from 'tailwindcss/plugin'
import { createPxComment } from '../utils/comment'

export const roundedScreen: ReturnType<typeof plugin> = plugin(function ({
  matchUtilities,
  theme,
}) {
  matchUtilities(
    {
      'v-rounded': (value) => ({
        borderRadius:
          `max(0px, min(${value}, (100vw - 100% - 1px) * 9999))` +
          createPxComment(value),
        '@media (pointer: fine)': {
          borderRadius:
            `max(0px, min(${value}, (100vw - 100% - 11px) * 9999))` +
            createPxComment(value),
        },
      }),
      'c-rounded': (value) => ({
        borderRadius:
          `max(0px, min(${value}, (100cqw - 100% - 1px) * 9999))` +
          createPxComment(value),
        '@media (pointer: fine)': {
          borderRadius:
            `max(0px, min(${value}, (100cqw - 100% - 11px) * 9999))` +
            createPxComment(value),
        },
      }),
    },
    { values: theme('borderRadius') },
  )
})
