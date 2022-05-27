# useBoolean

```tsx
const Component: React.FC = () => {
  const [state, control] = useBoolean(true)

  return (
    <>
      <button onClick={control.on}>on</button>
      <button onClick={control.off}>off</button>
      <button onClick={control.toggle}>toggle</button>
    </>
  )
}
```
