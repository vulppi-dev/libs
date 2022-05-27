# useFetch

```tsx
const Component: React.FC = (props, ref) => {

  const { data, textData, error, loading, reRequest } = useFetch<any>(
    'http://localhost:3000/api/demo',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // is default
      }
      bearerToken: '12345', // becomes Authorization: Bearer 12345
      basicAuth: '12345', // becomes Authorization: Basic 12345
      token: '12345', // becomes Authorization: 12345
      block: false, // is default
      dependencies: [], // is default
      body: JSON.stringify({
        name: 'John Doe',
        age: 30,
      }),
    },
  )

  return <></>
}
```
