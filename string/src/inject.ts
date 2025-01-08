const bracketsFinder =
  /{(?:const (?<variable>[A-zÀ-ú_\-$][A-zÀ-ú0-9_\-$]*)\s*=)?\s*(?<props>(?:\.?[A-zÀ-ú_\-$][A-zÀ-ú0-9_\-$]*)+)(?:\s*@\s*(?<filters>(?:\s*\|?\s*(?:[A-zÀ-ú_\-$][A-zÀ-ú0-9_\-$]*(?:\([^()]*\))?))+))?\s*}/gm

type FilterMatch = {
  key: string
  params: string[]
}

type InputMatch = {
  start: number
  end: number
  variable?: string
  props: string[]
  filters: FilterMatch[]
}

type FilterFunction = (value: any, ...params: any[]) => any

function extractFilter(str: string) {
  const filterRegex = /^([^\(]+)(?:\((.*)\))?$/
  const match = str.match(filterRegex)
  if (!match) return { key: str, params: [] }

  const key = match[1].trim()
  const paramsStr = match[2] || ''
  const params = paramsStr
    ? paramsStr.split(/\s*,\s*/).map((param) => param.trim())
    : []

  return { key, params }
}

function extractAllInputs(str: string) {
  const inputs: InputMatch[] = []
  const matches = [...str.matchAll(bracketsFinder)]

  for (const match of matches) {
    if (!match.groups) continue
    const { props, filters, variable } = match.groups
    const start = match.index
    const end = start + match[0].length
    inputs.push({
      start,
      end,
      variable,
      props: props.split('.'),
      filters: filters ? filters.split(/\s*\|\s*/).map(extractFilter) : [],
    })
  }
  return inputs
}

function getFromObject(obj: Record<string, any>, path: string[]) {
  return path.reduce((acc, prop) => {
    return acc?.[prop]
  }, obj) as any
}

export function createInjector(filters: Record<string, FilterFunction> = {}) {
  const filtersMap = new Map<string, FilterFunction>()
  for (const [key, filter] of Object.entries(filters)) {
    filtersMap.set(key, filter)
  }

  function runInput(
    input: InputMatch,
    data: Record<string, any>,
    variablesMap: Map<string, any>,
  ) {
    const { variable, props, filters } = input
    const value = variablesMap.has(props[0] || '')
      ? variablesMap.get(props[0] || '')
      : getFromObject(data, props) ?? undefined

    const result = filters.reduce((acc, filter) => {
      const { key, params } = filter
      const filterFn = filtersMap.get(key)
      if (!filterFn) throw new Error(`Filter ${key} not found`)

      return filterFn(acc, ...params)
    }, value)

    if (variable) {
      variablesMap.set(variable, result)
      return ''
    }
    return result
  }

  function inject(str: string, data: Record<string, any>) {
    const inputs = extractAllInputs(str)
    const parts = inputs
      .map((input, i, l) => {
        const before = l[i - 1] ? l[i - 1].end : 0
        const after = input.start
        return str.slice(before, after)
      })
      .concat(str.slice(inputs[inputs.length - 1].end))

    const variablesMap = new Map<string, any>()

    return parts.reduce((acc, part, i) => {
      const input = inputs[i]
      if (!input) return acc + part

      return acc + part + runInput(input, data, variablesMap)
    }, '')
  }

  return inject
}
