# useClickOutside

```tsx
const Component: React.FC = () => {
  const myRef = useRef()
  const fRef = useClickOutside(() => {
    // ...
  }, myRef)

  return <button ref={fRef}>ok</button>
}
```
