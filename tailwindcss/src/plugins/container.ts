import plugin from 'tailwindcss/plugin'
import { createPxComment } from '../utils/comment'
import { createNumber } from '../utils/theme-content'

const containers: ReturnType<typeof plugin> = plugin(
  function ({ matchUtilities, addUtilities, theme }) {
    addUtilities({
      '.flex-center': {
        alignItems: 'center',
        justifyContent: 'center',
      },
    })
    matchUtilities(
      {
        stack: (value) => ({
          display: 'flex',
          flexDirection: 'column' + value,
        }),
        cluster: (value) => ({
          display: 'flex',
          flexDirection: 'row' + value,
          flexWrap: 'wrap',
        }),
      },
      { values: theme('containersReverse') },
    )
    matchUtilities(
      {
        center: (value) => ({
          display: 'flex',
          flexDirection: 'column',
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '100%',
          maxWidth: `${value}` + createPxComment(value),
        }),
      },
      { values: { ...theme('width'), ...theme('maxWidth') } },
    )
    matchUtilities(
      {
        switcher: (value) => ({
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          '& > *': {
            flexGrow: '1',
            flexBasis: `calc((${value} - 100%) * 999)` + createPxComment(value),
            '& > *': {
              maxWidth: '100%',
            },
          },
        }),
        'switcher-reverse': (value) => ({
          display: 'flex',
          flexDirection: 'row-reverse',
          flexWrap: 'wrap',
          '& > *': {
            flexGrow: '1',
            flexBasis: `calc((${value} - 100%) * 999)` + createPxComment(value),
            '& > *': {
              maxWidth: '100%',
            },
          },
        }),
      },
      { values: theme('maxWidth') },
    )
    matchUtilities(
      {
        'switcher-threshold': (value) => ({
          [`& > :nth-last-child(n + ${value}), & > :nth-last-child(n + ${value}) ~ *`]:
            {
              flexBasis: '100%',
            },
        }),
      },
      { values: theme('switcherThreshold') },
    )
  },
  {
    theme: {
      containersReverse: {
        DEFAULT: '',
        reverse: '-reverse',
      },
      switcherThreshold: createNumber(16),
    },
  },
)

export default containers
