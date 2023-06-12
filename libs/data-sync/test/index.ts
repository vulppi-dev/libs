import { SyncServer } from '../src'

const port = 3333

const server = new SyncServer({
  path: '/sync',
})

server.listen(port, () => {
  console.log('Server started! in port %d', port)
})
