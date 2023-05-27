import { SyncServer } from '../src'

const server = new SyncServer({
  path: '/sync',
})

server.listen(3000)
