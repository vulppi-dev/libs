export { snapshot, subscribe } from 'valtio/vanilla'

import { deserializeObject, serializeObject } from '@vulppi/toolbelt'
import equal from 'deep-equal'
import WebSocket from 'isomorphic-ws'
import { TimeoutHandler } from 'timeout'
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
  if (!/^[a-z0-9_\-\$]+:[^: ]+$/i.test(key))
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
  private _ioURI: string | URL
  private _ioProtocols: string | string[]
  private _io: WebSocket
  private _dataMap = new Map<string, Record<string, any>>()
  private _preDataMap = new Map<string, Record<string, any>>()
  private _unsubMap = new Map<string, VoidFunction>()
  private _metaMap = new Map<string, Record<string, any>>()

  private _preSendPool = new Set<CommandData>()

  constructor(uri: string | URL, protocols?: string | string[]) {
    this._ioURI = uri
    this._ioProtocols = [
      'vulppi-datasync-client',
      ...((Array.isArray(protocols) ? protocols : protocols) || []),
    ]
    this._io = new WebSocket(this._ioURI, this._ioProtocols)
    this._prepare()
  }

  public leaveData(
    key: `${string}:${string}`,
    options?: {
      namespace?: string
      /**
       * @type {number} In seconds (min: 1 second)
       */
      autoUnbindTimeout?: number
    },
  ) {
    const safeKey = parseKey(key, options?.namespace)
    this._unbindData(safeKey)
  }
  /**
   * Get data binded to the Key from the server.
   */
  public getBindData<T extends Record<string, any>>(
    key: `${string}:${string}`,
    options?: {
      namespace?: string
      /**
       * @type {number} In seconds (min: 1 second)
       */
      autoUnbindTimeout?: number
    },
  ) {
    const safeKey = parseKey(key, options?.namespace)
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

    options?.autoUnbindTimeout &&
      this.autoClearIfUnused(options.autoUnbindTimeout, key, options.namespace)
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
    return proxyWithHistory(this.getBindData(key, { namespace })[0])
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
    if (meta.autoClear) {
      const timer = meta.autoClear as TimeoutHandler
      timer.restart(Math.max(duration * 1000, 1000))
      return
    }
    meta.autoClear = new TimeoutHandler(Math.max(duration * 1000, 1000), () => {
      this._unbindData(safeKey)
    })
    meta.autoClear.start()
  }

  private _prepare() {
    this._io.addEventListener('open', () => {
      this._preSendPool.forEach((data) => {
        this._send(data)
      })
      this._preSendPool.clear()

      const keys = Array.from(this._dataMap.keys())
      keys.forEach((key) => {
        this._send({
          key,
          agent: 'client',
          command: 'get',
        })
      })
    })
    this._io.addEventListener('message', async (ev) => {
      let bff: Buffer | null = null
      if (ev.data instanceof Buffer) {
        bff = ev.data
      } else if (ev.data instanceof Blob) {
        bff = Buffer.from(await ev.data.arrayBuffer())
      }
      if (!bff) return

      const { data, command, key } = deserializeObject(bff) as CommandData
      let newData: Record<string, any> = {}
      const dataMap = this._dataMap.get(key) || {}
      const meta = safeGetMap(
        key,
        this._metaMap,
        () => ({} as Record<string, any>),
      )
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

      meta.autoClear?.restart()
      this._preDataMap.set(key, JSON.parse(JSON.stringify(newData)))
    })
    this._io.addEventListener('close', (ev) => {
      if (ev.code === 1000) return
    })
    this._io.addEventListener('error', (err) => {
      if (err.message.includes('ECONNREFUSED')) {
        console.error('Connection refused!')
        return
      }
      console.error(err.message || err)
    })
  }

  reconnect() {
    this._io = new WebSocket(this._ioURI, this._ioProtocols)
    this._prepare()
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
    } else if (this._io.readyState === WebSocket.CLOSED) {
      this.reconnect()
    } else {
      this._preSendPool.add(data)
    }
  }
}
