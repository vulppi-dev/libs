function getPromiseTuple() {
  let resolve: VoidFunction
  const promise = new Promise<void>((r) => (resolve = r))
  return [() => resolve(), promise] as const
}

/**
 * Creates a lock object that can be used to synchronize access to a shared resource.
 *
 * @return An object with the following properties:
 *   - `length`: A getter function that returns the current number of active locks.
 *   - `lock`: An asynchronous function that returns a lock object. When called, it increments the `length` property and waits for any previously acquired locks to be released before resolving. The lock object has the following properties:
 *     - `length`: A getter function that returns the current number of active locks.
 *     - `unlock`: A function that releases the lock by decrementing the `length` property and resolving any waiting locks.
 */
export function createLocker() {
  let last_promise: Promise<void> | undefined = undefined
  let length = 0

  return {
    /**
     * Getter function that returns the current number of active locks.
     *
     * @return {number} The current number of active locks.
     */
    get length(): number {
      return length
    },
    /**
     * Asynchronously acquires a lock and returns a lock object.
     *
     * @return A promise that resolves to an object with two properties:
     *   - `length`: A getter function that returns the current number of active locks.
     *   - `unlock`: A function that releases the lock for the next lock can run.
     */
    async lock() {
      length++
      const last = last_promise
      const [resolve, promise] = getPromiseTuple()
      last_promise = promise

      if (last) {
        await last
      }

      return {
        /**
         * Getter function that returns the current number of active locks.
         *
         * @return {number} The current number of active locks.
         */
        get length() {
          return length
        },
        /**
         *  A function that releases the lock for the next lock can run.
         */
        unlock() {
          resolve()
          length--
          if (length === 0) last_promise = undefined
        },
      }
    },
  }
}
