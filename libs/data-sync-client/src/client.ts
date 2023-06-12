export { snapshot, subscribe } from 'valtio/vanilla'

import { deserializeObject, serializeObject } from '@vulppi/toolbelt'
import { proxyWithHistory } from 'valtio/utils'
import { proxy, subscribe } from 'valtio/vanilla'
import WSocket from 'isomorphic-ws'
import { TimeoutHandler } from './timeout'
import { safeGetMap, type Operations, deepEqual } from './tools'
import { set, unset } from 'lodash'

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

function invertOperations(ops: Operations[]): Operations[] {
  return ops.map(([op, path, after, before]) => {
    switch (op) {
      case 'set':
        if (before) return ['set', path, before, undefined] as Operations
        else return ['delete', path, undefined] as Operations
      case 'delete':
        return ['set', path, after, undefined] as Operations
    }
  })
}

function applyOperations(proxy: Record<string, any>, ops: Operations[]) {
  ops.forEach(([op, path, after, before]) => {
    const safePath = path.map((p) => (/^\d+$/.test(p) ? parseInt(p) : p))
    switch (op) {
      case 'set':
        set(proxy, safePath, after)
        break
      case 'delete':
        unset(proxy, safePath)
        break
    }
  })
}

function equalOperations(ops1: Operations[], ops2: Operations[]) {
  if (ops1.length !== ops2.length) return false
  for (let i = 0; i < ops1.length; i++) {
    const op1 = ops1[i]
    const op2 = ops2[i]
    if (op1[0] !== op2[0]) return false
    if (!deepEqual(op1[1], op2[1])) return false
    if (!deepEqual(op1[2], op2[2])) return false
    if (!deepEqual(op1[3], op2[3])) return false
  }
  return true
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
  private _preDataMap = new Map<string, Operations[]>()
  private _unsubMap = new Map<string, VoidFunction>()
  private _metaMap = new Map<string, Record<string, any>>()

  private _preSendPool = new Set<CommandData>()

  constructor(uri: string | URL, protocols?: string | string[]) {
    this._ioURI = uri
    this._ioProtocols = [
      'vulppi-datasync-client',
      ...((Array.isArray(protocols) ? protocols : protocols) || []),
    ]
    // @ts-ignore
    this._io = new WSocket(this._ioURI, this._ioProtocols)
    this._prepare()
  }

  public leaveData(
    key: `${string}:${string}`,
    options?: {
      namespace?: string
      /**
       * If the value is `0` or `undefined`, the data will not be unbinded.
       *
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
  public getData<T extends Record<string, any>>(
    key: `${string}:${string}`,
    options?: {
      namespace?: string
      /**
       * @type {number} In seconds (min: 1 second)
       */
      leaveTimeout?: number
    },
  ) {
    const safeKey = parseKey(key, options?.namespace)
    this._send({
      key: safeKey,
      agent: 'client',
      command: 'get',
    })

    const proxyData = safeGetMap(safeKey, this._dataMap, () => {
      const data = proxy({})
      const unsub = subscribe(data, (ops) => {
        this._preDataMap.set(safeKey, invertOperations(ops as Operations[]))
        const meta = safeGetMap(safeKey, this._metaMap, () => ({} as any))

        if (
          meta.server &&
          (meta.serverOps == null ||
            equalOperations(meta.serverOps, ops as Operations[]))
        ) {
          meta.server = false
          meta.serverOps = null
          return
        }
        this._send({
          data: { ops },
          key: safeKey,
          agent: 'client',
          command: 'set',
        })
      })
      this._unsubMap.set(safeKey, unsub)
      return data
    }) as T

    const unbindData = () => {
      this._unbindData(safeKey)
    }

    options?.leaveTimeout &&
      this.leaveDataTimeout(options.leaveTimeout, key, options.namespace)
    return Object.assign([proxyData, unbindData], {
      data: proxyData,
      unbind: unbindData,
    }) as [T, VoidFunction] & { data: T; unbind: VoidFunction }
  }

  /**
   * Get data binded to the Key from the server.
   * This function will return a proxy with history.
   */
  public getDataWithHistory(
    key: `${string}:${string}`,
    namespace: string = 'default',
  ) {
    return proxyWithHistory(this.getData(key, { namespace })[0])
  }

  /**
   *
   * @param duration In seconds (min: 1 second)
   * @param key document key
   * @param namespace
   */
  public leaveDataTimeout(
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

  reconnect() {
    // @ts-ignore
    this._io = new WSocket(this._ioURI, this._ioProtocols)
    this._prepare()
  }

  disconnect() {
    this._io.close(1000, 'disconnect')
  }

  close() {
    this.disconnect()
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
    this._io.addEventListener('message', async (ev: MessageEvent) => {
      let bff: ArrayBuffer | null = null
      if (ev.data instanceof ArrayBuffer) {
        bff = ev.data
      } else if (ev.data instanceof Blob) {
        bff = await ev.data.arrayBuffer()
      }
      if (!bff) return

      const { data, command, key } = deserializeObject(bff) as CommandData
      const dataMap = this._dataMap.get(key) || {}
      const meta = safeGetMap(
        key,
        this._metaMap,
        () => ({} as Record<string, any>),
      )

      // TODO: create versioning system
      meta.server = !deepEqual(dataMap, data)

      if (command === 'get' && data) {
        const newData = (data || {}) as Record<string, any>
        const newKeys = Object.keys(newData)
        const oldKeys = Object.keys(dataMap)
        const removeKeys = oldKeys.filter((k) => !newKeys.includes(k))

        Object.assign(dataMap, newData)
        removeKeys.forEach((k) => {
          delete dataMap[k]
        })
      } else if (command === 'set' && data) {
        const user = data.user as Record<'name' | 'id', string>
        const ops = data.ops as Operations[]
        meta.serverOps = ops
        applyOperations(dataMap, ops)
      } else if (command === 'error') {
        const ops = safeGetMap(key, this._preDataMap, () => [] as Operations[])
        applyOperations(dataMap, ops)
      }
      this._preDataMap.set(key, [])
      meta.autoClear?.restart()
    })
    this._io.addEventListener('close', (ev: CloseEvent) => {
      if (ev.code === 1000) return
    })
    this._io.addEventListener('error', (ev: Event) => {
      console.error(ev)
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
