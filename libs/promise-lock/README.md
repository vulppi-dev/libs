# Vulppi Promise Lock

A simple way for wait async tasks to protect multiple access to a shared resource.

## Usage

You can use the following:

```ts
import { createLocker } from '@vulppi/promise-lock'

const locker = createLocker({ timeout: 20000 }) // 20 seconds timeout

async function randomDelay(index: number) {
  const lock = await locker.lock()

  const delay = Math.floor(Math.random() * 1000)

  await new Promise((resolve) => setTimeout(resolve, delay))

  console.log(
    'Index:',
    index,
    '|',
    'Delayed:',
    delay,
    '|',
    'Pool length:',
    lock.length,
  )

  lock.unlock()
}

for (let i = 0; i < 10; i++) {
  randomDelay(i)
}

/*
 * Final output:
 *
 * Index: 0 | Delayed: 492 | Pool length: 10
 * Index: 1 | Delayed: 797 | Pool length: 9
 * Index: 2 | Delayed: 538 | Pool length: 8
 * Index: 3 | Delayed: 202 | Pool length: 7
 * Index: 4 | Delayed: 454 | Pool length: 6
 * Index: 5 | Delayed: 249 | Pool length: 5
 * Index: 6 | Delayed: 597 | Pool length: 4
 * Index: 7 | Delayed: 669 | Pool length: 3
 * Index: 8 | Delayed: 411 | Pool length: 2
 * Index: 9 | Delayed: 234 | Pool length: 1
 *
 * Note: Only one task per time can access the resource
 */
```
