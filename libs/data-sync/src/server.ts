export type {
  CommandData,
  DataKey,
  ValidationData,
  ValidationFunction,
} from './tools'

import {
  deserializeObject,
  serializeObject,
  type Nullable,
} from '@vulppi/toolbelt'
import { Server } from 'http'
import { MemoryProvider, type SyncProvider } from 'provider'
import { URLSearchParams } from 'url'
import type { ServerOptions, WebSocket } from 'ws'
import { WebSocketServer } from 'ws'
import type { CommandData, ValidationData, ValidationFunction } from './tools'
import { HEADER_KEY, HEADER_VALUE, clearOptions, genGUID } from './tools'

/**
 * The SyncServer class is a server for data synchronization.
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
export class SyncServer {
  private _srv: Server
  private _io: WebSocketServer
  private _validation: ValidationFunction | undefined
  private _heartbeatInterval: number = 10000
  private _clientMap: Map<string, Set<WebSocket>> = new Map()
  private _provider: SyncProvider = new MemoryProvider()

  constructor(
    opt: Omit<ServerOptions, 'port' | 'noServer'> | undefined,
    cb?: () => void,
  ) {
    if (opt) {
      clearOptions(opt)
    }
    this._srv = opt?.server || new Server()
    this._io = new WebSocketServer({ ...opt, server: this._srv }, cb)
    this._prepare()
    this._startHeartbeat()
  }

  /**
   * Set the heartbeat interval in seconds.
   *
   * @default 10
   * @param interval
   */
  public setHeartbeatInterval(interval: number) {
    this._heartbeatInterval = interval * 1000
  }

  /**
   * Validation function can be used to validate the client,
   * if the function returns false, the client is disconnected.
   *
   * @param validation
   */
  public setValidation(validation: ValidationFunction) {
    this._validation = validation
  }

  /**
   * Case you want to use a provider for persist data.
   *
   * @example
   * ```ts
   * import { SyncServer, MemoryProvider } from '@vulppi/data-sync'
   *
   * const server = new SyncServer()
   * server.setProvider(new MemoryProvider())
   * ```
   *
   * @param provider
   */
  public setProvider(provider: SyncProvider) {
    this._provider = provider
  }

  /**
   * Start the server.
   *
   * @param port
   * @param cb
   */
  public listen(port: number, cb?: () => void) {
    this._srv.listen(port, cb)
  }

  /**
   * Close the server.
   *
   * @param cb
   */
  public onClose(cb: () => void) {
    this._srv.on('close', cb)
  }

  /**
   * Error event.
   *
   * @param cb
   */
  public onError(cb: (err: Error) => void) {
    this._srv.on('error', cb)
  }

  private _prepare() {
    this._io.on('connection', async (socket, req) => {
      // Verify if the client is a vulppi-datasync-client
      if (
        !(HEADER_KEY in req.headers) ||
        req.headers[HEADER_KEY] !== HEADER_VALUE
      ) {
        socket.terminate()
        return
      }

      let context: Nullable<Record<string, any>> = {}
      // Verify if the client is valid
      if (this._validation) {
        const validationData: ValidationData = {
          params: new URLSearchParams(req.url?.split('?')[1]),
        }
        const authorization = req.headers.authorization || ''
        if (/^basic .+/i.test(authorization)) {
          const [user, pass] = Buffer.from(
            authorization.replace(/^basic +/i, ''),
            'base64',
          )
            .toString()
            .split(':')
          validationData.user = user
          validationData.pass = pass
        } else if (/^bearer .+/i.test(authorization)) {
          validationData.token = authorization.replace(/^bearer +/i, '')
        }

        context = await this._validation(validationData)
      }

      if (!context) {
        socket.terminate()
        return
      }

      this._loadClient(socket, context)
    })
    this._io.on('error', (err) => {
      console.error('Error:', err)
    })
  }

  private _loadClient(socket: WebSocket, context: Record<string, any>) {
    socket.on('message', async (bff) => {
      if (!(bff instanceof Buffer)) return

      const { command, agent, data, key } = deserializeObject<CommandData>(bff)
      let clients: Set<WebSocket> | undefined

      switch (command) {
        case 'get':
        case 'bind':
          if (!this._clientMap.has(key)) {
            this._clientMap.set(key, new Set())
          }
          clients = this._clientMap.get(key)!
          clients.add(socket)

          socket.send(
            serializeObject({
              command: 'set',
              agent: 'server',
              key,
              data: await this._provider.get(key, context),
            }),
          )
          break
        case 'set':
        case 'update':
          clients = this._clientMap.get(key)
          if (!clients) return

          const end = await this._provider.concurrencySet(
            key,
            data || {},
            context,
          )

          const dataToSend = await this._provider.get(key, context)
          clients.forEach((client) => {
            if (client.readyState !== client.OPEN) return

            client.send(
              serializeObject({
                command: 'set',
                agent: 'server',
                key,
                data: dataToSend,
              }),
            )
          })
          end()
          break
        case 'unbind':
          clients = this._clientMap.get(key)
          if (!clients) return
          clients.delete(socket)

          if (clients.size === 0) {
            this._clientMap.delete(key)
            await this._provider.clear(key)
          }
          break
      }
    })
  }

  private _startHeartbeat() {
    setTimeout(() => {
      this._io.clients.forEach((client) => {
        if (client.readyState !== client.OPEN) {
          client.terminate()
          return
        }
        const pingId = genGUID()
        client.once('pong', (data) => {
          if (data.toString() !== pingId) {
            client.terminate()
          }
        })
        client.ping(pingId)
      })
      this._startHeartbeat()
    }, this._heartbeatInterval)
  }
}
