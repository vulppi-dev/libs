export { snapshot, subscribe } from 'valtio/vanilla'

import { deserializeObject, serializeObject } from '@vulppi/toolbelt'
import equal from 'deep-equal'
import type { ClientRequestArgs } from 'http'
import type { ClientOptions } from 'isomorphic-ws'
import { WebSocket } from 'isomorphic-ws'
import { proxyWithHistory } from 'valtio/utils'
import { proxy, subscribe } from 'valtio/vanilla'
import { safeGetMap } from './tools'

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
  private _ioConfig: ClientOptions | ClientRequestArgs
  private _io: WebSocket
  private _dataMap = new Map<string, Record<string, any>>()
  private _preDataMap = new Map<string, Record<string, any>>()
  private _unsubMap = new Map<string, VoidFunction>()
  private _metaMap = new Map<string, Record<string, any>>()

  private _preSendPool = new Set<CommandData>()

  constructor(uri: string | URL, opt?: ClientOptions | ClientRequestArgs) {
    this._ioConfig = {
      ...opt,
      headers: {
        ...opt?.headers,
        'X-VULPPI-CLIENT': 'vulppi-datasync-client',
      },
    }
    this._io = new WebSocket(uri, this._ioConfig)
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

    const proxyData = safeGetMap(safeKey, this._dataMap, () => {
      this._preDataMap.set(safeKey, {})
      const data = proxy({})
      const unsub = subscribe(data, () => {
        this._checkAndSend(data, safeKey)
      })
      this._unsubMap.set(safeKey, unsub)
      return data
    }) as T

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

  /**
   *
   * @param duration In seconds (min: 1 second)
   * @param key document key
   * @param namespace
   */
  public autoClearIfUnused(
    duration: number,
    key: `${string}:${string}`,
    namespace: string = 'default',
  ) {
    const safeKey = parseKey(key, namespace)
    const meta = safeGetMap(
      safeKey,
      this._metaMap,
      () => ({} as Record<string, any>),
    )
    if (meta.autoClearId) {
      clearTimeout(meta.autoClearId)
    }
    meta.autoClearId = setTimeout(() => {
      this._unbindData(safeKey)
    }, Math.max(duration * 1000, 1000))
  }

  private _prepare() {
    this._io.on('open', () => {
      console.debug('Connection opened!')
      this._preSendPool.forEach((data) => {
        this._send(data)
      })
      this._preSendPool.clear()

      const keys = Array.from(this._dataMap.keys())
      console.debug('Requesting data from server...', keys)
      keys.forEach((key) => {
        this._send({
          key,
          agent: 'client',
          command: 'get',
        })
      })
    })
    this._io.on('message', (bff) => {
      if (!(bff instanceof Buffer)) return
      const { data, command, key } = deserializeObject(bff) as CommandData
      if (!this._metaMap.has(key)) {
        this._metaMap.set(key, {})
      }
      let newData: Record<string, any> = {}
      const dataMap = this._dataMap.get(key) || {}
      const meta = this._metaMap.get(key)!
      meta.server = !equal(dataMap, data)
      // TODO: create versioning system

      if (command === 'set') {
        newData = data || {}
      } else if (command === 'error') {
        newData = safeGetMap(key, this._preDataMap, () => ({}))
      }

      const dataMapKeys = Object.keys(dataMap)
      const dataKeys = Object.keys(newData)

      const keysToRemove = dataMapKeys.filter((k) => !dataKeys.includes(k))
      Object.assign(dataMap, newData)
      keysToRemove.forEach((k) => {
        delete dataMap[k]
      })

      this._preDataMap.set(key, JSON.parse(JSON.stringify(newData)))
    })
    this._io.on('close', (code) => {
      if (code === 1000) return
      this._reconnect()
    })
    this._io.on('error', (err) => {
      if (err.message.includes('ECONNREFUSED')) {
        console.error('Connection refused!')
        return
      }
      console.error(err.cause || err.message || err)
    })
  }

  private _reconnect() {
    setTimeout(() => {
      console.debug('Reconnecting...')
      this._io = new WebSocket(this._io.url, this._ioConfig)
      this._prepare()
    }, 2000)
  }

  private _checkAndSend<T extends Record<string, any>>(data: T, key: string) {
    const meta = this._metaMap.get(key) || {}
    if (meta.server) {
      meta.server = false
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
