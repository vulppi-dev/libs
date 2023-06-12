import { SyncClient, subscribe } from '../src'
import { createInterface } from 'readline'
import { promiseDelay } from '@vulppi/toolbelt'

const client = new SyncClient('ws://localhost:3333/sync')
const [data] = client.getData('test:test')

subscribe(data, () => {
  console.log('changed:', data)
})

const reader = createInterface({
  input: process.stdin,
  output: process.stdout,
})

reader.on('line', (line) => {
  const [key, ...value] = line.split(' ')
  if (['q', 'quit', 'exit'].includes(key)) {
    process.exit(0)
  }

  const v = value.join(' ')
  if (key === 'delete') {
    delete data[v]
  } else {
    data[key] = ['true', 'false'].includes(v) ? v === 'true' : +v || v
  }
})

// Promise.resolve()
//   .then(async () => {
//     await promiseDelay(1000)

//     data.foo = 'bar'
//     data.counter = 0
//     data.deep = {
//       foo: 'bar',
//       children: [{ name: 'child1' }, { name: 'child2' }],
//     }
//   })
//   .then(async () => {
//     await promiseDelay(2000)

//     data.foo = 'bar2'
//     data.counter = 1
//     delete data.deep.foo
//     data.deep.children[0].rename = 'child1-2'
//     delete data.deep.children[0].name
//     data.deep.children.splice(1, 1)
//     data.deep.children.push({ name: 'child3' })
//     data.deep.another = 'another'
//   })
