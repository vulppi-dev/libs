# @vulppi/data-sync-client

![npm](https://img.shields.io/npm/v/@vulppi/data-sync-client?style=flat-square)
![npm](https://img.shields.io/npm/dt/@vulppi/data-sync-client?style=flat-square)
![GitHub](https://img.shields.io/github/license/morbden/@vulppi/data-sync-client?style=flat-square)

`@vulppi/data-sync-client` is the client-side JavaScript library for interacting with the `@vulppi/data-sync` server. It provides functionality to connect to the server, subscribe to data updates, and manage synchronized data. This package is developed by [Renato Rodrigues](https://github.com/morbden).

## Installation

You can install the package via npm:

```shell
npm install @vulppi/data-sync-client
```

## Usage

Here's a usage example of `@vulppi/data-sync-client` in a client application:

```jsx
import React, { useState } from 'react'
import { SyncClient, subscribe } from '@vulppi/data-sync-client'
import { useSnapshot } from 'valtio'

const client = new SyncClient('ws://localhost:3000/sync')
const [data, unbind] = client.getBindData('test:test')

// You can use subscribe from package valtio
subscribe(data, () => {
  console.log('changed:', data)
})

const App = () => {
  const snapshot = useSnapshot(data)
  const [inputValue, setInputValue] = useState('')

  const handleChange = (e) => {
    setInputValue(e.target.value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    data.key = inputValue
    setInputValue('')
  }

  return (
    <div>
      <h1>Data Sync Example</h1>
      <p>Current value: {snapshot.key}</p>
      <form onSubmit={handleSubmit}>
        <input type="text" value={inputValue} onChange={handleChange} />
        <button type="submit">Update</button>
      </form>
    </div>
  )
}

export default App
```

In this example, we import React and the necessary components from `@vulppi/data-sync-client` and `valtio`. We create a `SyncClient` instance and connect to the `@vulppi/data-sync` server.

The synchronized data object is retrieved using `getBindData`, and the `useSnapshot` hook from `valtio` is used to create a reactive snapshot of the data. The component will re-render whenever the data changes.

The `App` component renders a simple form with an input field and a button. The current value of the synchronized data is displayed, and the form allows users to update the value. When the form is submitted, the `handleSubmit` function updates the `key` property of the data object with the new value from the input field.

This example demonstrates the basic usage of `@vulppi/data-sync-client` with `React` and `valtio`, allowing for real-time data synchronization and reactive rendering of the UI.

For more advanced usage and integration with React components, refer to the `valtio` [documentation](https://vulppi.dev/docs/data-sync-client).

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request on the [GitHub repository](https://github.com/vulppi-dev/libs).

When contributing to this repository, please first discuss the change you wish to make via issue before making a pull request.

## License

This package is open source and available under the [MIT License](https://github.com/vulppi-dev/libs/blob/main/libs/data-sync-client/LICENSE).
