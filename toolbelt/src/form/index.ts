/**
 * Serializes a form element or FormData object into a JavaScript object.
 *
 * @param {HTMLFormElement | FormData} form - The form element or FormData object to serialize.
 * @return {Record<string, any>} - The serialized form data as a JavaScript object.
 */
export function serializeForm(
  form: HTMLFormElement | FormData,
): Record<string, any> {
  const formData = form instanceof FormData ? form : new FormData(form)
  const body = Object.fromEntries(formData)
  const result: Record<string, any> = {}

  for (let k in body) {
    if (k.includes('.')) {
      const keys = k.split('.')
      let current = result
      for (let i = 0; i < keys.length; i++) {
        const kk = parseKey(keys[i])

        if (i === keys.length - 1) {
          current[kk] = body[k]
        } else {
          const nk = parseKey(keys[i + 1])
          const isNumber = typeof nk === 'number'
          current = current[kk] = current[kk] || (isNumber ? [] : {})
        }
      }
    } else {
      result[k] = body[k]
    }
  }

  return result
}

function parseKey(k: string) {
  if (/^\d+$/.test(k.trim())) {
    return parseInt(k)
  }
  return k.trim()
}
