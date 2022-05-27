# useStateDebounce

```tsx
const Component: React.FC = (props, ref) => {
  const [state, setState] = useStateDebounce<boolean>(2000, false)

  return <button onClick={() => setState((b) => !b)}>reverse</button>
}
```
