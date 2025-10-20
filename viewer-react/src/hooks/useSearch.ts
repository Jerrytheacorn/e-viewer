import { useQuery } from '@tanstack/react-query'
import { searchPosts, Platform } from '../services/api'
import { useRef, useEffect, useState } from 'react'

export function useSearch(query: string, platform: Platform, limit = 80, enabled = true) {
  // Debounce query
  const [debounced, setDebounced] = useState(query)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350)
    return () => clearTimeout(t)
  }, [query])
  return useQuery(['search', debounced, platform, limit], () => searchPosts(debounced, platform, limit), {
    enabled: !!debounced && enabled,
    keepPreviousData: true,
    staleTime: 1000 * 60
  })
}
