import React, { useCallback } from 'react'
import type { E621Post } from '../types/e621'
import useInfiniteScroll from '../hooks/useInfiniteScroll'

type Props = {
  posts?: E621Post[]
  loading?: boolean
  onOpen?: (p: E621Post) => void
  onLoadMore?: () => void
}

export default function ImageGrid({ posts = [], loading = false, onOpen, onLoadMore }: Props){
  const handleLoadMore = useCallback(() => {
    if (onLoadMore) onLoadMore()
  }, [onLoadMore])
  useInfiniteScroll(handleLoadMore)

  if (loading && (!posts || posts.length === 0)) return <div className="text-gray-400">Loading...</div>
  if (!posts || posts.length === 0) return <div className="text-gray-400">No results</div>

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {posts.map(p => (
          <div key={p.id} className="h-40 bg-gray-700 rounded overflow-hidden cursor-pointer flex flex-col items-center justify-center" onClick={() => onOpen && onOpen(p)}>
            <div className="flex-1 w-full flex items-center justify-center">
              {p.file.type === 'video' ? (
                p.file.preview_url ? (
                  <img src={p.file.preview_url} alt="video preview" className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="text-xs text-gray-400">Video</div>
                )
              ) : (
                <img src={p.file.preview_url || p.file.url} alt={p.tags?.general?.slice(0,3).join(', ')} className="w-full h-full object-cover"/>
              )}
            </div>
            <div className="text-xs text-gray-300 mt-1 truncate w-full text-center px-1">
              {(p.tags?.general || []).slice(0, 6).join(', ')}
            </div>
          </div>
        ))}
      </div>
      <div id="infinite-sentinel" className="h-8"></div>
      {loading && <div className="text-gray-400 mt-2">Loading more...</div>}
    </>
  )
}
