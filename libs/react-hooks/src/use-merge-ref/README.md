# useMergeRef

```jsx
const Component = forwardRef((props, ref) => {
  const myRef = useRef()
  const fRef = useMergeRef(myRef, ref)

  return <button ref={fRef}>ok</button>
})
```
