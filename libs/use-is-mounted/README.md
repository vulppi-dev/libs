# useIsMounted

```tsx
const Component: React.FC = (props, ref) => {
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
