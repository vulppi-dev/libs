import { useEffect, useState } from 'react'

type ReceiverType<T> = (() => Promise<T>) | Promise<T>
type ResultAsync<T> = [T, boolean, any] & {
  loading: boolean
  value: T
  error: any
}

const parseReceiver = <T>(receiver: ReceiverType<T>): Promise<T> => {
  if (typeof receiver === 'function') {
    return receiver()
  } else {
    return receiver
  }
}

export const useAsync = <T = any>(
  cb: ReceiverType<T>,
  dependencies: any[] = [],
) => {
  const [value, setValue] = useState<T>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>()

  useEffect(() => {
    setLoading(true)
    setError(undefined)
    setValue(undefined)

    parseReceiver(cb)
      .then(setValue)
      .catch(setError)
      .finally(() => setLoading(false))
  }, dependencies)

  return Object.assign([value, loading, error], {
    value,
    loading,
    error,
  }) as ResultAsync<T>
}
