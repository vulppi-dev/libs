export const COMMENT_LINE_START = /^\s*#/
export const PROPERTY_LINE_START = /^[a-zA-Z0-9_]+=.*/
export const PROPERTY_LINE_VALIDATION = /^[a-zA-Z0-9_]+=.*/m

/**
 * Parses the input text into an object containing key-value pairs.
 *
 * @param {string} txt - The input text to parse
 * @return {Record<'key' | 'value' | 'description', string>[]} An array of objects with key, value, and description
 */
export function parseEnvToObject(
  txt: string,
): Record<'key' | 'value' | 'description', string>[] {
  const lines = txt.split('\n')
  const env: Record<'key' | 'value' | 'description', string>[] = []

  let lastIndex: number = -1
  let descriptions: string[] = []
  let multiline = ''

  lines.forEach((line) => {
    if (COMMENT_LINE_START.test(line)) {
      descriptions.push(line.replace(COMMENT_LINE_START, '').trim())
      return
    }

    if (!PROPERTY_LINE_START.test(line)) {
      if (multiline) {
        env[lastIndex].value += '\n' + line

        if (/["']\s*$/.test(line) && multiline === line.trim().at(-1)) {
          multiline = ''
          env[lastIndex].value = env[lastIndex].value
            .trim()
            .replace(/^["']/g, '')
            .replace(/["']$/g, '')
        }
      }
      return
    }

    const [key, value] = line.split('=').map((s) => s.trim())
    lastIndex++
    env[lastIndex] = env[lastIndex] || {}
    env[lastIndex].key = key
    env[lastIndex].value = value

    if (
      /^\s*['"]/.test(value) &&
      (!/["']\s*$/.test(value) || value.trim().at(-1) !== value.trim().at(0))
    ) {
      multiline = value[0]
    }

    if (descriptions.length > 0) {
      env[lastIndex].description = descriptions.join('\n')
      descriptions = []
    }
  })

  return env
}

/**
 * Parses an array of objects containing key-value pairs and descriptions into a string representation of an environment file.
 *
 * @param {Record<'key' | 'value' | 'description', string>[]} env - An array of objects containing key-value pairs and descriptions.
 * @return {string} A string representation of an environment file.
 */
export function parseObjectToEnv(
  env: Record<'key' | 'value' | 'description', string>[],
): string {
  return env
    .map(
      ({ key, value, description }) =>
        `${description.replace(/\n/g, '\n# ')}\n${key}=${value}`,
    )
    .join('\n')
}
