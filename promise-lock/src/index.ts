export type Lock = {
  /**
   * Getter function that returns the current number of active locks.
   *
   * @return {number} The current number of active locks.
   */
  readonly length: number
  /**
   * Getter function that returns if the lock is already free.
   *
   * @return {boolean} If the lock is already free.
   */
  readonly is_free: boolean
  /**
   * A function that releases the lock for the next lock can run.
   */
  unlock: () => void
  /**
   * A function that releases the lock and stops propagation.
   */
  stopPropagation: () => void
}

/**
 * Creates a lock object that can be used to synchronize access to a shared resource.
 *
 * @param opt.timeout - The timeout in milliseconds for acquiring the lock.
 *  Defaults to 20 seconds.
 *  If timeout is 0, it will never timeout.
 *
 * @return An object with the following properties:
 *   - `length`: A getter function that returns the current number of active locks.
 *   - `lock`: An asynchronous function that returns a lock object. When called, it increments the `length` property and waits for any previously acquired locks to be released before resolving. The lock object has the following properties:
 *     - `length`: A getter function that returns the current number of active locks.
 *     - `unlock`: A function that releases the lock by decrementing the `length` property and resolving any waiting locks.
 */
export function createLocker(opt?: { timeout?: number }) {
  const { timeout = 20000 } = opt || {}

  let last_promise: Promise<boolean> | undefined = undefined
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
      let locked = true
      const last = last_promise
      const { resolve, promise } = Promise.withResolvers<boolean>()
      last_promise = promise

      const unlock = () => {
        resolve(true)
        locked = false
        length--
        if (length === 0) {
          last_promise = undefined
        }
      }

      const stopPropagation = () => {
        resolve(false)
        length--
        if (length === 0) {
          last_promise = undefined
        }
      }

      if (last) {
        const result = await last
        if (!result) {
          stopPropagation()
          throw new Error('The propagation was interrupted')
        }
      }

      if (timeout > 0) {
        setTimeout(unlock, timeout)
      }

      return {
        get is_free() {
          return !locked
        },
        get length(): number {
          return length
        },
        unlock,
        stopPropagation,
      } as Lock
    },
  }
}
