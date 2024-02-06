/**
 * Clamp a value between a minimum and maximum value
 *
 * @param value Value to be clamped
 * @param min Minimum include value to be clamped
 * @param max Maximum include value to be clamped
 *
 * @default min: 0, max: 1
 *
 * @returns Value clamped between min and max
 */
export function clamp(value: number, min: number = 0, max: number = 1) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation between two values
 * @param a Start value
 * @param b End value
 * @param t Interpolation value
 */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t)
}

/**
 * Create a step curve based on index and length
 *
 * @param index Index value
 * @param length Length value
 * @param invert Invert the curve
 *
 */
export function curveStep(index: number, length: number, invert?: boolean) {
  return curve(index / (length - 1), invert)
}

/**
 * Create a smooth curve
 *
 * @param t Interpolation value between 0 and 1
 */
export function curve(t: number, invert = false) {
  const safeT = Math.max(0, Math.min(1, t))
  return Math.sin(Math.PI * safeT) * (invert ? -1 : 1) + (invert ? 1 : 0)
}
