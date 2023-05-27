import type { ClientRequestArgs } from 'http'
import type { ClientOptions } from 'isomorphic-ws'
import { WebSocket } from 'isomorphic-ws'
import { serializeObject } from '@vulppi/toolbelt'

export class SyncClient {
  private _io: WebSocket
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
  private _prepare() {
    this._io.on('open', () => {
      console.log('open')
      this._io.send(serializeObject({ data: {}, agent: 'client' }))
    })
    this._io.on('message', (e) => {
      console.log(e)
    })
    this._io.on('close', () => {
      console.log('close')
    })
    this._io.on('error', (err) => {
      console.error('Error:', err)
    })
  }
}
