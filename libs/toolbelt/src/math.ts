export const clamp = (value: number, min: number = 0, max: number = 1) =>
  Math.min(Math.max(value, min), max)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t)
