# useIsMounted

```jsx
const Component = (props, ref) => {
  const mounted = useIsMounted()

  useEffect(() => {
    document.addListener('event', () => {
      if (mounted.current) {
        // ... do something
      }
    })
  }, [])

  return <></>
}
```
