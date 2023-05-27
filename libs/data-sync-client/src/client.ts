import type { ClientRequestArgs } from 'http'
import type { ClientOptions } from 'isomorphic-ws'
import { WebSocket } from 'isomorphic-ws'
import { deserializeObject, serializeObject } from '@vulppi/toolbelt'
import { proxy, subscribe } from 'valtio/vanilla'
import { proxyWithHistory } from 'valtio/utils'

export interface CommandData {
  command: string
  agent: 'server' | 'client' | 'anonymous'
  key: string
  data?: Record<string, any>
}

function parseKey(key: string, namespace: string = 'default') {
  if (!/^[a-z0-9_-$]+:[a-z0-9_-$]+$/i.test(key))
    throw new Error(
      'Invalid key format. Key must be in format of <collection>:<id> (e.g. user:1)',
    )

  return `${namespace}:${key}`
}

export class SyncClient {
  private _io: WebSocket
  private _dataMap = new Map<string, Record<string, any>>()
  private _unsubMap = new Map<string, VoidFunction>()

  constructor(uri: string | URL, opt?: ClientOptions | ClientRequestArgs) {
    this._io = new WebSocket(uri, {
      ...opt,
      headers: {
        ...opt?.headers,
        'X-VULPPI-CLIENT': 'vulppi-datasync-client',
      },
    })
    this._prepare()
  }

  public getBindData<T extends Record<string, any>>(
    key: `${string}:${string}`,
    namespace?: string,
  ) {
    const safeKey = parseKey(key, namespace)
    this._io.send(
      serializeObject({
        key: safeKey,
        agent: 'client',
        command: 'get',
      }),
    )

    let proxyData: T

    if (!this._dataMap.has(safeKey)) {
      proxyData = proxy({} as T)
      this._dataMap.set(safeKey, proxyData)
      const unsub = subscribe(proxyData, () => {
        this._checkAndSend(proxyData, safeKey)
      })
      this._unsubMap.set(safeKey, unsub)
    } else {
      proxyData = this._dataMap.get(safeKey) as T
    }

    const unbindData = () => {
      this._unbindData(safeKey)
    }

    return Object.assign([proxyData, unbindData], {
      data: proxyData,
      unbind: unbindData,
    }) as [T, VoidFunction] & { data: T; unbind: VoidFunction }
  }

  public getHistory(key: `${string}:${string}`, namespace: string = 'default') {
    return proxyWithHistory(this.getBindData(key, namespace))
  }

  private _prepare() {
    this._io.on('open', () => {
      console.log('open')
    })
    this._io.on('message', (bff) => {
      if (!(bff instanceof Buffer)) return
      const { data, command, key } = deserializeObject(bff) as CommandData
      // TODO: implement something with agent

      if (command === 'set') {
        const dataMap = this._dataMap.get(key)
        if (dataMap) {
          Object.assign(dataMap, data)
        }
      }
    })
    this._io.on('close', () => {
      console.log('close')
    })
    this._io.on('error', (err) => {
      console.error('Error:', err)
    })
  }

  private _checkAndSend<T extends Record<string, any>>(data: T, key: string) {
    this._io.send(
      serializeObject({
        data,
        key,
        agent: 'client',
        command: 'set',
      }),
    )
  }

  private _unbindData(key: string) {
    const unsub = this._unsubMap.get(key)
    unsub?.()
    this._unsubMap.delete(key)
    this._dataMap.delete(key)
    this._io.send(serializeObject({ key, agent: 'client', command: 'unbind' }))
  }
}
