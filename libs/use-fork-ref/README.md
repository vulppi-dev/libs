# useForkRef

```tsx
const Component: React.FC = forwardRef((props, ref) => {
  const myRef = useRef()
  const fRef = useForkRef(myRef, ref)

  return <button ref={fRef}>ok</button>
})
```
