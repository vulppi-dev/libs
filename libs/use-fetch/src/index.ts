import { useEffect, useState } from 'react'

type RequestConfig = RequestInit & {
  token?: string
  basicToken?: string
  bearerToken?: string
}

type RequestHookConfig = RequestConfig & {
  blockRequest?: boolean
  dependencies?: any[]
}

type ErrorResult = {
  status?: number
  statusText?: string
  exception?: Error
}

export function useFetch<T = any>(
  request: RequestInfo,
  config?: RequestHookConfig,
) {
  const [trigger, setTrigger] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<T | null>(null)
  const [textData, setTextData] = useState<string | null>(null)
  const [error, setError] = useState<ErrorResult | null>(null)
  const {
    blockRequest,
    headers,
    token,
    basicToken,
    bearerToken,
    dependencies = [],
    ...extraConfig
  } = config || {}

  useEffect(() => {
    setData(null)
    setTextData(null)
    setError(null)

    if (blockRequest) return

    const controller = new AbortController()

    setLoading(true)
    fetch(request, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization:
          token ||
          (bearerToken && `Bearer ${bearerToken}`) ||
          (basicToken && `Basic ${basicToken}`) ||
          '',
        ...headers,
      },
      ...extraConfig,
    })
      .then(async (response) => {
        setError({
          status: response.status,
          statusText: response.statusText,
        })
        const value = await response.text()
        setTextData(value)
        try {
          if (response.headers.get('Content-Type') !== 'application/json')
            return
          const jsonValue = JSON.parse(value)
          setData(jsonValue)
        } catch (_) {}
      })
      .catch((err) => {
        console.error(err)
        setError({
          exception: err,
        })
      })
      .finally(() => {
        setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [trigger, blockRequest].concat(dependencies))

  return {
    data,
    textData,
    error,
    loading,
    reRequest: () => setTrigger((i) => i++),
  }
}
