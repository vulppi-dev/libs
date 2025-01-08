export function createNumber(length: number) {
  return Array.from({ length }, (_, i) => i + 1).reduce(
    (acc, cur) => ({ ...acc, [cur]: cur.toString() }),
    {} as Record<string, string>,
  )
}

export function createLabels<In extends string | number>(list: Readonly<In[]>) {
  return list.reduce(
    (acc, cur) => ({ ...acc, [cur]: cur.toString() }),
    {} as Record<string, string>,
  )
}
