import { SyncClient, subscribe } from '../src'

const client1 = new SyncClient('ws://localhost:3000/sync')

const client2 = new SyncClient('ws://localhost:3000/sync')

const [data1] = client1.getBindData('user:1')
const [data2] = client2.getBindData('user:1')

subscribe(data2, () => {
  console.log('observer data2', data2)
})

subscribe(data1, () => {
  console.log('observer data1', data1)
})

console.log('data1', data1)
console.log('data2', data2)

data1.name = 'John'
data1.counter = 0

setInterval(() => {
  console.log('trigger data1')
  data1.counter++
  console.log('trigger data2')
  data2.counter += 1.5
}, 4000)
