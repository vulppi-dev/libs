# @vulppi/data-sync

![npm](https://img.shields.io/npm/v/@vulppi/data-sync?style=flat-square)
![npm](https://img.shields.io/npm/dt/@vulppi/data-sync?style=flat-square)
![GitHub](https://img.shields.io/github/license/your-username/repo-name?style=flat-square)

`@vulppi/data-sync` is a lightweight JavaScript library for data synchronization. It provides a simple and intuitive way to synchronize data between different sources or environments. This package is developed by [Renato Rodrigues](https://github.com/morbden).

## Installation

You can install the package via npm:

```shell
npm install @vulppi/data-sync
```

## Usage

Here's a basic example of how to use `@vulppi/data-sync`:

```ts
import { SyncServer, MemoryProvider } from '@vulppi/data-sync'

// Create a new DataSyncServer instance
const dataSync = new SyncServer({
  path: '/realtime',
})

// Add a data provider
dataSync.setProvider(new MemoryProvider())
// or
class CustomProvider extends SyncProvider {
  async get<T extends Record<string, any>>(key: DataKey, context: UserContext) {
    // this.dataMap is a Map object that stores the data
    if (!this.dataMap.has(key)) {
      this.dataMap.set(key, {} as T)
    }
    return this.dataMap.get(key) as T
  }

  async set(key: DataKey, data: Record<string, any>, context: UserContext) {
    // In set method, you can persist the data to a database or other storage
  }

  async clear(key: DataKey, context: UserContext) {
    // You can also implement the clear method to delete data
    // This method is called when the client stop observe this data
    return this.dataMap.delete(key)
  }

  async clearAll(context: UserContext) {
    // You can also implement the clearAll method to delete all data
    // This method is called when the client connection is closed
    this.dataMap.clear()
  }
}
dataSync.setProvider(new CustomProvider())

// Set validation rules
dataSync.setValidation((payload) => {
  const {
    // If Authorization header is Bearer token, this is the token
    token,
    // If Authorization header is Basic auth, this is the username and password
    user,
    pass,
    // Contains the data in URLSearchParams
    params,
  } = payload

  // You can implement your own validation rules and return context user data
  return {
    id: 1,
    name: 'John Doe',
  }
})

// Start the server
dataSync.listen(3000, () => {
  console.log('Server started')
})

// or in creation of http server
const server = http.createServer()

const dataSync = new SyncServer({
  path: '/realtime',
  server: server,
})
```

In the above example, we create a `SyncServer` instance and configure it to listen on the `/realtime` path. We add a data provider, either using the `MemoryProvider` class or by extending the `SyncProvider` class, but is optional, by default `MemoryProvider` is used.

The example demonstrates the use of a custom provider called `CustomProvider`. It overrides the `get()`, `set()`, `clear()`, and `clearAll()` methods to handle data retrieval, storage, and deletion. The example also shows the usage of the `setValidation()` method to define validation rules for incoming requests.

The server is started using the `listen()` method, which specifies the port to listen on. Alternatively, you can pass an existing HTTP server instance to the `SyncServer` constructor.

For more detailed usage instructions and advanced features, please refer to the [documentation](https://vulppi.dev/docs/data-sync).

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the [GitHub repository](https://github.com/vulppi-dev/libs).

When contributing to this repository, please first discuss the change you wish to make via issue before making a pull request.

## License

This package is open source and available under the [MIT License](https://github.com/vulppi-dev/libs/blob/main/libs/data-sync/LICENSE).
