import { createLocker } from '../src'

const locker = createLocker()

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
