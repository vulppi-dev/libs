# useStateDebounce

```jsx
const Component = (props, ref) => {
  const [state, setState] = useStateDebounce(2000, false)

  return <button onClick={() => setState((b) => !b)}>reverse</button>
}
```
