import { SyncClient, subscribe } from '@vulppi/data-sync-client'

const dataSync1 = new SyncClient('ws://localhost:3333')
const dataSync2 = new SyncClient('ws://localhost:3333')

const [data1] = dataSync1.getData('store:shared')
const [data2] = dataSync2.getData('store:shared')

export const store1 = {
  subscribe: (run: (v: any) => void, invalidate?: (v?: any) => void) =>
    subscribe(data1, (ops) => {
      console.log('store1', ops)
      run(data1)
    }),
  set: (v: any) => {
    const dataKeys = Object.keys(data1)
    const vKeys = Object.keys(v)

    Object.assign(data1, v)

    const toRemoveKeys = dataKeys.filter((key) => !vKeys.includes(key))
    toRemoveKeys.forEach((key) => delete data1[key])
  },
}

export const store2 = {
  subscribe: (run: (v: any) => void, invalidate?: (v?: any) => void) =>
    subscribe(data2, (ops) => {
      console.log('store2', ops)
      run(data2)
    }),
  set: (v: any) => {
    const dataKeys = Object.keys(data2)
    const vKeys = Object.keys(v)

    Object.assign(data2, v)

    const toRemoveKeys = dataKeys.filter((key) => !vKeys.includes(key))
    toRemoveKeys.forEach((key) => delete data2[key])
  },
}
