export { subscribe, snapshot } from 'valtio/vanilla'

import type { ClientRequestArgs } from 'http'
import type { ClientOptions } from 'isomorphic-ws'
import { WebSocket } from 'isomorphic-ws'
import { deserializeObject, serializeObject } from '@vulppi/toolbelt'
import { proxy, subscribe } from 'valtio/vanilla'
import { proxyWithHistory } from 'valtio/utils'
import equal from 'deep-equal'

export interface CommandData {
  command: string
  agent: 'server' | 'client' | 'anonymous'
  key: string
  data?: Record<string, any>
}

function parseKey(key: string, namespace: string = 'default') {
  if (!/^[a-z0-9_\-\$]+:[a-z0-9_\-\$]+$/i.test(key))
    throw new Error(
      'Invalid key format. Key must be in format of <collection>:<id> (e.g. user:1)',
    )
  return `${namespace}:${key}`
}

/**
 * Sync data client
 *
 * @example
 * ```ts
 * // server.ts
 * import { SyncServer } from '@vulppi/data-sync'
 *
 * const server = new SyncServer()
 * server.listen(8080)
 *
 * // client1.ts
 * import { SyncClient } from '@vulppi/data-sync-client'
 *
 * const client = new SyncClient('ws://localhost:8080')
 *
 * const object = client.getData('objectId')
 *
 * object.foo = 'bar'
 * object.counter++
 *
 * // client2.ts
 * import { SyncClient } from '@vulppi/data-sync-client'
 *
 * const client = new SyncClient('ws://localhost:8080')
 *
 * const object = client.getData('objectId')
 *
 * console.log(object.foo) // bar
 * console.log(object.counter) // 1
 * ```
 *
 * @author Vulppi
 * @license MIT
 */
export class SyncClient {
  private _io: WebSocket
  private _dataMap = new Map<string, Record<string, any>>()
  private _unsubMap = new Map<string, VoidFunction>()
  private _flagsMap = new Map<string, Record<string, boolean>>()

  private _preSendPool = new Set<CommandData>()

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

  /**
   * Get data binded to the Key from the server.
   */
  public getBindData<T extends Record<string, any>>(
    key: `${string}:${string}`,
    namespace?: string,
  ) {
    const safeKey = parseKey(key, namespace)
    this._send({
      key: safeKey,
      agent: 'client',
      command: 'get',
    })

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

  /**
   * Get data binded to the Key from the server.
   * This function will return a proxy with history.
   */
  public getHistory(key: `${string}:${string}`, namespace: string = 'default') {
    return proxyWithHistory(this.getBindData(key, namespace))
  }

  private _prepare() {
    this._io.on('open', () => {
      this._preSendPool.forEach((data) => {
        this._send(data)
      })
      this._preSendPool.clear()
    })
    this._io.on('message', (bff) => {
      if (!(bff instanceof Buffer)) return
      const { data, command, key } = deserializeObject(bff) as CommandData
      if (!this._flagsMap.has(key)) {
        this._flagsMap.set(key, {})
      }
      const flags = this._flagsMap.get(key)!
      if (command === 'set') {
        const dataMap = this._dataMap.get(key)!
        flags.server = !equal(dataMap, data)

        const dataMapKeys = Object.keys(dataMap)
        const dataKeys = Object.keys(data || {})

        const keysToRemove = dataMapKeys.filter((k) => !dataKeys.includes(k))
        Object.assign(dataMap, data)
        keysToRemove.forEach((k) => {
          delete dataMap[k]
        })
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
    const flags = this._flagsMap.get(key) || {}
    if (flags.server) {
      flags.server = false
      return
    }
    this._send({
      data,
      key,
      agent: 'client',
      command: 'set',
    })
  }

  private _unbindData(key: string) {
    const unsub = this._unsubMap.get(key)
    unsub?.()
    this._unsubMap.delete(key)
    this._dataMap.delete(key)
    this._send({ key, agent: 'client', command: 'unbind' })
  }

  private _send(data: CommandData) {
    if (this._io.readyState === WebSocket.OPEN) {
      this._io.send(serializeObject(data))
    } else {
      this._preSendPool.add(data)
    }
  }
}
