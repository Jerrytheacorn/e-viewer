import React, { useEffect, useRef, useState } from 'react'
import type { E621Post } from '../types/e621'

export default function Slideshow({ posts, startIndex = 0, onClose }: { posts: E621Post[]; startIndex?: number; onClose: () => void }){
  const [index, setIndex] = useState(startIndex)
  const [playing, setPlaying] = useState(true)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent){
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index])

  useEffect(() => {
    if (playing) {
      timerRef.current = window.setTimeout(() => setIndex(i => (i + 1) % posts.length), 6000)
    }
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current) }
  }, [playing, index, posts.length])

  function next(){ setIndex(i => (i + 1) % posts.length) }
  function prev(){ setIndex(i => (i - 1 + posts.length) % posts.length) }

  if (!posts || posts.length === 0) return null
  const p = posts[index]
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center" onClick={onClose}>
      {/* Close button */}
      <button className="absolute top-4 right-6 z-50 text-3xl text-gray-300 hover:text-white bg-black bg-opacity-40 rounded-full w-12 h-12 flex items-center justify-center" onClick={e => { e.stopPropagation(); onClose() }} title="Close">×</button>

      {/* Left arrow */}
      <button className="absolute left-2 top-1/2 z-40 -translate-y-1/2 text-5xl text-white bg-black bg-opacity-30 hover:bg-opacity-60 rounded-full w-16 h-24 flex items-center justify-center" onClick={e => { e.stopPropagation(); prev() }} title="Previous">❮</button>
      {/* Right arrow */}
      <button className="absolute right-2 top-1/2 z-40 -translate-y-1/2 text-5xl text-white bg-black bg-opacity-30 hover:bg-opacity-60 rounded-full w-16 h-24 flex items-center justify-center" onClick={e => { e.stopPropagation(); next() }} title="Next">❯</button>

      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
        {p.file.type === 'video' ? (
          <video src={p.file.video_url || p.file.url} controls autoPlay className="max-h-[80vh] max-w-full bg-black rounded-lg shadow-lg" />
        ) : (
          <img src={p.file.url} alt={p.tags?.general?.slice(0,3).join(', ')} className="max-h-[80vh] max-w-full rounded-lg shadow-lg" />
        )}

        {/* Navbox/info bar */}
        <div className="w-full mt-4 bg-black bg-opacity-70 rounded-lg px-6 py-3 flex flex-col items-center shadow-lg">
          <div className="text-lg font-bold text-white mb-1">Post #{p.id}</div>
          <div className="text-xs text-gray-300 mb-2 break-words text-center max-w-full">
            {(p.tags?.general || []).slice(0, 18).join(', ')}
          </div>
          <div className="flex gap-4 items-center">
            <button className="p-2 bg-gray-700 rounded text-white" onClick={e => { e.stopPropagation(); setPlaying(s => !s) }}>{playing ? 'Pause' : 'Play'}</button>
            <a
              href={p.file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-blue-700 rounded text-white"
              onClick={e => e.stopPropagation()}
            >Open Image</a>
            <a
              href={`https://e621.net/posts/${p.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-gray-700 rounded text-white"
              onClick={e => e.stopPropagation()}
            >e621 Post</a>
          </div>
        </div>
      </div>
    </div>
  )
}
