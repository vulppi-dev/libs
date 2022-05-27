# useAsync

```tsx
const Component: React.FC = () => {
  const { loading, error, value } = useAsync(
    fetch('https://jsonplaceholder.typicode.com/todos/1'),
  )

  return <></>
}
```
