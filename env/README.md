# Vulppi ENV

A simple library to parse environment files.

## Usage

```ts
import { parseEnvToList, parseListToEnv } from '@vulppi/env'

const env = parseEnvToList(`
# This is a comment
KEY=VALUE
ANOTHER_KEY="Another value"
# This is another comment
`)

console.log(env)

const envString = parseListToEnv(env)

console.log(envString)
```

## License

MIT
