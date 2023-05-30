# useTimer

```jsx
const Component = (props, ref) => {
  const [value, timerControl] = useTimer(
    1, // Increment value
    500, // Time step in millis
  )

  return (
    <>
      <button onClick={timerControl.start}>start</button>
      <button onClick={timerControl.stop}>stop</button>
      <button onClick={timerControl.restart}>restart</button>
    </>
  )
}
```
