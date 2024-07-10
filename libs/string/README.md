# Vulppi String

A simple string library.

## Usage

For regular expressions, you can use the following:

```ts
import { REGEXP_UUID, REGEXP_EMAIL } from '@vulppi/string'

console.log(REGEXP_UUID.test('123e4567-e89b-12d3-a456-426614174000')) // true
console.log(REGEXP_EMAIL.test('john.due@example.com')) // true
```

For string manipulation, you can use the following:

```ts
import { createInjector } from '@vulppi/string'

const injector = createInjector(
  // The filters for manipulate data
  {
    uppercase: (value: string) => value.toUpperCase(),
    lowercase: (value: string) => value.toLowerCase(),
    capitalize: (value: string) =>
      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase(),
    date: (value: string) =>
      new Intl.DateTimeFormat('en-US').format(new Date(value)),
  },
)

console.log(injector('Hello world. {name@capitalize}!', { name: 'MARIE' }))
// Output: `Hello world. Marie!`

console.log(injector('Now is {now@date}', { now: new Date() }))
// Output: `Now is 1/1/2021`
```
