import { renderHook, act } from '@testing-library/react-hooks'
import { useAsync } from './index'

describe('useAsync', () => {
  it('should be defined', () => {
    expect(useAsync).toBeDefined()
  })
  it('should be a function', () => {
    expect(typeof useAsync).toBe('function')
  })
  it('should return a array with length 3', () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve('test')))
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })
    expect(result.current).toHaveLength(3)
  })
  it('should return a Promise with value: test', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve('test')))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })
    expect(result.current[0]).toBe('test')
  })
  it('should return a Promise with delay and value: test', async () => {
    const { result } = renderHook(() =>
      useAsync(() => {
        return new Promise((resolve) => setTimeout(() => resolve('test'), 100))
      }),
    )
    expect(result.current[0]).toBe(undefined)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(result.current[0]).toBe(undefined)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(result.current[0]).toBe('test')
  })
  it('should return a Promise with error', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.reject('test')))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })
    expect(result.current[2]).toBe('test')
  })
  it('should return a Promise with delay and error', async () => {
    const { result } = renderHook(() =>
      useAsync(() => {
        return new Promise((_, reject) => setTimeout(() => reject('test'), 100))
      }),
    )
    expect(result.current[2]).toBe(undefined)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(result.current[2]).toBe(undefined)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(result.current[2]).toBe('test')
  })
  it('should loading value change to false when promise resolve', async () => {
    const { result } = renderHook(() =>
      useAsync(() => {
        return new Promise((resolve) => setTimeout(() => resolve('test'), 50))
      }),
    )
    expect(result.current[1]).toBe(true)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })
    expect(result.current[1]).toBe(false)
  })
})
