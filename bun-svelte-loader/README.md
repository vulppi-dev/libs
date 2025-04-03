# Vulppi Bun Svelte Loader

## Overview

`@vulppi/bun-svelte-loader` is a plugin for the [Bun](https://bun.sh/) JavaScript runtime that enables seamless loading and compilation of Svelte components. With this plugin, you can easily integrate Svelte into your Bun projects.

## Installation

Install the plugin:

```bash
bun install @vulppi/bun-svelte-loader
```

## Usage

To use the plugin, add it to your `bunfig.toml` configuration file:

```toml
[serve.static]
plugins=["@vulppi/bun-svelte-loader"]
```

Once configured, you can import and use Svelte components in your project:

```ts
//app.ts
import App from './App.svelte'

const app = new App({
  target: document.body,
  props: {
    name: 'World',
  },
})

export default app
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Svelte App</title>
  </head>
  <body>
    <script type="module" src="./app.ts"></script>
  </body>
</html>
```

## Features

- Automatic compilation of `.svelte` files.
- Seamless integration with Bun's plugin system.
- Optimized for performance.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve the plugin.

## Support

If you encounter any issues or have questions, please open an issue on the [GitHub repository](https://github.com/vulppi-dev/libs/tree/main/bun-svelte-loader).
