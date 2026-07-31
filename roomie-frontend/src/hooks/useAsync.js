import { useCallback, useEffect, useRef, useState } from 'react'

import { errorMessage } from '../core/api/client'

/**
 * Runs an async loader on mount (and whenever `deps` change), exposing
 * `{ data, loading, error, reload, setData }`.
 */
export function useAsync(loader, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await loader()
      if (mounted.current) setData(result)
      return result
    } catch (err) {
      if (mounted.current) setError(errorMessage(err))
      return null
    } finally {
      if (mounted.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (immediate) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, immediate])

  return { data, loading, error, reload: run, setData }
}
