function isRem(str: string) {
  return /^[0-9]+rem$/.test(str)
}

function parseRemToPx(str: string) {
  const remValue = parseFloat(str.replace(/rem$/, ''))
  return `${remValue * 16}px`
}

export function createPxComment(str: string) {
  if (isRem(str)) return ` /* ${parseRemToPx(str)} */`
  return ''
}