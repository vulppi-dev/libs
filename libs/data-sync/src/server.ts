export type {
  CommandData,
  DataKey,
  UserContext,
  ValidationData,
  ValidationFunction,
} from './tools'

import {
  deserializeObject,
  serializeObject,
  type Nullable,
} from '@vulppi/toolbelt'

import Cookies from 'cookie'
import { Server as HTTPServer, IncomingMessage } from 'http'
import { Server as HTTPSServer } from 'https'
import type { Duplex } from 'stream'
import { URLSearchParams } from 'url'
import type { ServerOptions, WebSocket } from 'ws'
import { WebSocketServer } from 'ws'
import { MemoryProvider, type SyncProvider } from './provider'
import type {
  CommandData,
  DataKey,
  UserContext,
  ValidationData,
  ValidationFunction,
} from './tools'
import {
  HEADER_KEY,
  HEADER_VALUE,
  clearOptions,
  genGUID,
  safeGetMap,
} from './tools'

export type SyncServerOptions = Omit<
  ServerOptions,
  'port' | 'noServer' | 'server'
> & {
  server?: HTTPServer | HTTPSServer | boolean
}

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
  private readonly _opt: ServerOptions
  private _srv: HTTPServer | HTTPServer | undefined
  private _io: WebSocketServer
  private _validation: ValidationFunction | undefined
  private _heartbeatInterval: number = 10000
  private _clientMap: Map<DataKey, Set<WebSocket>> = new Map()
  private _provider: SyncProvider = new MemoryProvider()
  private _heartbeatRunning: NodeJS.Timeout | null = null

  constructor(opt: SyncServerOptions | undefined, cb?: () => void) {
    if (opt) {
      clearOptions(opt)
    }
    if (opt?.server != null && typeof opt?.server !== 'boolean') {
      this._srv = opt.server
    }
    if (opt?.server || opt?.server == null) {
      this._srv = new HTTPServer()
    }

    this._opt = { ...opt, server: this._srv, noServer: opt?.server === false }
    this._io = new WebSocketServer(this._opt, cb)
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
    cb && this._io.on('listening', cb)
    this.attach(new HTTPServer())
    this._srv!.listen(port)
  }

  /**
   * Close the server.
   *
   * @param cb
   */
  public onClose(cb: () => void) {
    this._io.on('close', cb)
  }

  /**
   * Attach a server to the SyncServer.
   */
  public attach(server: HTTPServer | HTTPSServer) {
    if (this._heartbeatRunning) {
      clearTimeout(this._heartbeatRunning)
      this._heartbeatRunning = null
    }

    this._srv = server
    this._opt.server = server
    this._io = new WebSocketServer(this._opt)
    this._prepare()
    this._startHeartbeat()
  }

  /**
   * Error event.
   *
   * @param cb
   */
  public onError(cb: (err: Error) => void) {
    this._io.on('error', cb)
  }

  /**
   * This handleUpgrade method is a convenient wrapper around the handleUpgrade
   * function provided by the underlying WebSocket library. It allows for
   * handling upgrade requests from the client and establishing WebSocket connections.
   *
   * The method takes in several parameters:
   *
   * 1. __request__: `IncomingMessage` - This represents the incoming
   *   HTTP request from the client.
   * 1. __socket__: `Duplex` - This is the underlying network socket associated
   *   with the request.
   * 1. __upgradeHead__: `Buffer` - This parameter contains the optional upgrade
   *   head information, which can be used for protocol-specific upgrades.
   * 1. __callback__: `(client: WebSocket, request: IncomingMessage) => void` -
   *   This is the callback function that will be invoked once the upgrade is
   *   complete. It takes a client object representing the WebSocket
   *   connection and the original request object.
   */
  public handleUpgrade(
    request: IncomingMessage,
    socket: Duplex,
    upgradeHead: Buffer,
    callback: (client: WebSocket, request: IncomingMessage) => void,
  ) {
    this._io.handleUpgrade(request, socket, upgradeHead, callback)
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

      let context: Nullable<UserContext> = { id: '' }
      // Verify if the client is valid
      if (this._validation) {
        const headers = req.headers
        const cookies = Cookies.parse(headers.cookie || '')
        const validationData: ValidationData = {
          params: new URLSearchParams(req.url?.split('?')[1]),
          cookies,
        }
        const authorization = headers.authorization || ''
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

        try {
          context = await this._validation(validationData)
        } catch (err) {
          context = null
          this._io.emit('error', err)
        }
      }

      if (!context) {
        socket.terminate()
        return
      }

      if (!context.id) {
        context.id = genGUID()
      }

      this._loadClient(socket, context)
    })
  }

  private _loadClient(socket: WebSocket, context: UserContext) {
    socket.send(
      serializeObject({
        command: 'init',
        data: context,
        agent: 'server',
      }),
    )

    socket.on('message', async (bff) => {
      if (!(bff instanceof Buffer)) return
      const { command, agent, data, key } = deserializeObject<CommandData>(bff)
      let clients: Set<WebSocket> | undefined

      switch (command) {
        case 'get':
        case 'bind':
          clients = safeGetMap(key, this._clientMap, () => new Set())
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
          clients = safeGetMap(key, this._clientMap, () => new Set())
          if (!clients.size) return
          try {
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
          } catch (err: any) {
            socket.send(
              serializeObject({
                command: 'error',
                agent: 'server',
                key,
                data: err.message || err,
              }),
            )
          }
          break
        case 'leave':
        case 'unbind':
          clients = this._clientMap.get(key)
          if (!clients) return
          clients.delete(socket)

          if (clients.size === 0) {
            this._clientMap.delete(key)
            await this._provider.clear(key, context)
          }
          break
      }
    })

    socket.on('close', () => {
      this._provider.clearAll(context)
    })
  }

  private _startHeartbeat() {
    this._heartbeatRunning = setTimeout(() => {
      if (this._heartbeatRunning) {
        this._heartbeatRunning = null
      }

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
