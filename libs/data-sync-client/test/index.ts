import { SyncClient, subscribe } from '../src'
import { createInterface } from 'readline'

const client = new SyncClient('ws://localhost:3001/sync', ['mine'])
const [data] = client.getBindData('test:test')

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
