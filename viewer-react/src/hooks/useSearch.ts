import { useQuery } from '@tanstack/react-query'
import { searchPosts, Platform } from '../services/api'
import { useEffect, useState } from 'react'
import type { PlatformSettings } from '../components/Settings'

export function useSearch(query: string, platform: Platform, limit = 80, settings?: PlatformSettings, enabled = true) {
  // Debounce query
  const [debounced, setDebounced] = useState(query)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350)
    return () => clearTimeout(t)
  }, [query])
  
  return useQuery(
    ['search', debounced, platform, limit, settings], 
    () => searchPosts(debounced, platform, limit, settings), 
    {
      enabled: !!debounced && enabled,
      keepPreviousData: true,
      staleTime: 1000 * 60
    }
  )
}