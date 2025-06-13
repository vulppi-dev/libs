/**
 * The promiseDelay function is a utility function that returns a Promise
 * that resolves after a specified number of milliseconds.
 */
export function promiseDelay(ms: number) {
  return new Promise<never>((resolve) => setTimeout(resolve, ms))
}

/**
 * The clone function is a utility function that creates a deep copy of an object.
 * It uses structuredClone if available, otherwise falls back to JSON serialization.
 *
 * @param obj - The object to clone.
 * @returns A deep copy of the input object.
 */
export function clone<E extends any>(obj: E) {
  if (typeof structuredClone !== 'function') {
    return JSON.parse(JSON.stringify(obj)) as E
  } else {
    return structuredClone(obj)
  }
}

/**
 * The omitShallowProps function is a utility function that creates a shallow copy of an object
 * and omits the specified keys from the copy.
 *
 * @param obj - The object to clone and omit properties from.
 * @param keys - The keys to omit from the cloned object.
 * @returns A new object with the specified keys omitted.
 *
 * @example
 * const original = { a: 1, b: 2, c: 3 };
 * const result = omitShallowProps(original, 'b', 'c');
 * console.log(result); // { a: 1 }
 */
export function omitShallowProps<P extends object, K extends keyof P>(
  obj: P,
  ...keys: K[]
) {
  const ret = clone(obj)
  for (const key of keys) {
    delete ret[key]
  }
  return ret as Omit<P, K>
}

/**
 * The tryCatchCallback function is a utility function that allows you to run a callback function
 * and catch any errors that occur without a block try/catch statement.
 *
 * @param run - Function to run
 * @param cbErr - Callback function to handle errors
 *
 * @returns The result of the run function or null if an error occurs.
 *
 * @example
 * tryCatchCallback(() => {
 *   throw new Error('Test error');
 * }, (err) => {
 *   console.error('Caught error:', err);
 * });
 */
export function tryCatchCallback<R extends Function>(run: R, cbErr: any) {
  try {
    return run()
  } catch (err) {
    console.error(err)
    cbErr && cbErr(err)
    return null
  }
}

/**
 * The omitNullables function is a utility function that creates a deep copy of an object
 * and omits any properties that are null or undefined.
 *
 * @param obj - Object to omit null or undefined values from
 * @returns A new object with null or undefined values omitted
 *
 * @example
 * const original = { a: 1, b: null, c: undefined, d: { e: 2, f: null } };
 * const result = omitNullables(original);
 * console.log(result); // { a: 1, d: { e: 2 } }
 */
export function omitNullables<R extends object>(obj: R): R {
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj))
    return obj.filter((v) => v != null).map(omitNullables) as R

  const result: Record<string, any> = {}
  for (const key in obj) {
    const value = obj[key]
    if (value != null) {
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          result[key] = value.filter((v) => v != null).map(omitNullables)
        } else {
          result[key] = omitNullables(value)
        }
      } else {
        result[key] = value
      }
    }
  }
  return result as R
}

/**
 * The tryCatch function is a utility function that allows you to run a function
 * and catch any errors that occur without a block try/catch statement.
 *
 * @param cb - Function to run
 * @returns [result, error]
 *
 * @example
 * const [result, error] = tryCatch(() => {
 *   return JSON.parse(jsonText);
 * });
 * if (error) {
 *   console.error('Error fetching data:', error);
 * } else {
 *   console.log('Data:', result);
 * }
 *
 */
export function tryCatch<F extends (...args: any[]) => any>(
  cb: F,
): [ReturnType<F>, null] | [null, Error] {
  try {
    return [cb(), null] as [ReturnType<F>, null]
  } catch (err: any) {
    if (err instanceof Error) {
      return [null, err]
    } else if (typeof err === 'string') {
      return [null, new Error(err)]
    } else {
      return [
        null,
        new Error('Unknown error', {
          cause: err,
        }),
      ]
    }
  }
}

/**
 * The tryCatchAsync function is a utility function that allows you to run an async function
 * and catch any errors that occur without a block try/catch statement.
 *
 * @param cb - Function to run
 * @returns [result, error]
 *
 * @example
 * const [result, error] = await tryCatch(async () => {
 *   const data = await fetchData();
 *   return data;
 * });
 * if (error) {
 *   console.error('Error fetching data:', error);
 * } else {
 *   console.log('Data:', result);
 * }
 *
 */
export async function tryCatchAsync<F extends (...args: any[]) => Promise<any>>(
  cb: F,
): Promise<[ReturnType<F>, null] | [null, Error]> {
  try {
    return [await cb(), null] as [ReturnType<F>, null]
  } catch (err: any) {
    if (err instanceof Error) {
      return [null, err]
    } else if (typeof err === 'string') {
      return [null, new Error(err)]
    } else {
      return [
        null,
        new Error('Unknown error', {
          cause: err,
        }),
      ]
    }
  }
}

/**
 * The tryCatchPromise function is a utility function that allows you
 * catch any errors that occur without a block try/catch statement or then/catch methods.
 *
 * @param promise - Promise to await
 * @returns [result, error]
 *
 * @example
 * const [result, error] = await tryCatchPromise(fetchData());
 * if (error) {
 *   console.error('Error fetching data:', error);
 * } else {
 *   console.log('Data:', result);
 * }
 *
 */
export async function tryCatchPromise<T>(
  promise: Promise<T>,
): Promise<[T, null] | [null, Error]> {
  try {
    return [await promise, null]
  } catch (err: any) {
    if (err instanceof Error) {
      return [null, err]
    } else if (typeof err === 'string') {
      return [null, new Error(err)]
    } else {
      return [
        null,
        new Error('Unknown error', {
          cause: err,
        }),
      ]
    }
  }
}
