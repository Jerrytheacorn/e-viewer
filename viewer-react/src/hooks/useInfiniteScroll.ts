import { useEffect, useRef } from 'react'

export default function useInfiniteScroll(callback: () => void) {
  const obs = useRef<IntersectionObserver | null>(null)
  useEffect(() => {
    const sentinel = document.getElementById('infinite-sentinel')
    if (!sentinel) return
    obs.current = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) callback() })
    }, { root: null, rootMargin: '200px' })
    obs.current.observe(sentinel)
    return () => { if (obs.current) obs.current.disconnect() }
  }, [callback])
}
