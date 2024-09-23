/**
 * Parse string bytes to number
 *  1kb = 1024 bytes
 *  1mb = 1048576 bytes
 *  1gb = 1073741824 bytes
 *  1tb = 1099511627776 bytes
 *
 * @param bytes
 * @returns
 */
export function parseStringBytesToNumber(bytes: string | number): number {
  if (typeof bytes !== 'string') return bytes

  const [, size, unit] = bytes.match(/^(\d+)([kmgt]b?)$/i) || []
  if (!size || !unit) return 0
  const sizeNumber = parseInt(size)
  if (isNaN(sizeNumber)) return 0
  switch (unit.toLowerCase()) {
    case 'tb':
      return sizeNumber * 1024 * 1024 * 1024 * 1024
    case 'gb':
      return sizeNumber * 1024 * 1024 * 1024
    case 'mb':
      return sizeNumber * 1024 * 1024
    case 'kb':
      return sizeNumber * 1024
    default:
      return sizeNumber
  }
}

/**
 * Parses a string to its corresponding primitive value (number, boolean, null, undefined, NaN, Infinity).
 * Returns the original string if it doesn't match any known primitive value representations.
 */
export function parseStringToAutoDetectPrimitiveValue(val?: string | null) {
  const value = val?.trim().toLowerCase()

  if (value == null || value === '') return undefined
  if (value === 'null') return null
  if (value === 'undefined') return undefined
  if (value === 'nan') return NaN
  if (value === 'infinity') return Infinity
  if (value === '-infinity') return -Infinity
  if (/^(no|n|false|f|off)$/i.test(value)) return false
  if (/^(yes|y|true|t|on)$/i.test(value)) return true
  if (!isNaN(Number(value))) return Number(value)
  return value
}
