# useClickOutside

```jsx
const Component = () => {
  const myRef = useRef()
  const fRef = useClickOutside(() => {
    // ...
  }, myRef)

  return <button ref={fRef}>ok</button>
}
```
