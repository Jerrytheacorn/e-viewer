import React, { useState, useEffect } from 'react'
import type { E621Post } from '../types/e621'

interface Props {
  posts: E621Post[]
  startIndex: number
  onClose: () => void
}

export default function Slideshow({ posts, startIndex, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  const [autoPlay, setAutoPlay] = useState(false)

  useEffect(() => {
    if (!autoPlay) return
    const interval = setInterval(() => {
      setCurrentIndex(i => (i + 1) % posts.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [autoPlay, posts.length])

  const current = posts[currentIndex]
  const isVideo = current?.file.type === 'video'

  const handleNext = () => setCurrentIndex(i => (i + 1) % posts.length)
  const handlePrev = () => setCurrentIndex(i => (i - 1 + posts.length) % posts.length)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        {current && (
          <>
            {isVideo ? (
              <video src={current.file.video_url || current.file.url} controls autoPlay className="max-h-[90vh] max-w-full" />
            ) : (
              <img src={current.file.url} alt="slideshow" className="max-h-[90vh] max-w-full" />
            )}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 bg-black bg-opacity-70 p-3 rounded">
              <button onClick={handlePrev} className="px-3 py-1 bg-indigo-600 rounded">← Prev</button>
              <span className="px-3 py-1 text-white">{currentIndex + 1} / {posts.length}</span>
              <button onClick={handleNext} className="px-3 py-1 bg-indigo-600 rounded">Next →</button>
              <button onClick={() => setAutoPlay(!autoPlay)} className={`px-3 py-1 rounded ${autoPlay ? 'bg-green-600' : 'bg-gray-600'}`}>
                {autoPlay ? '⏸' : '▶'}
              </button>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 text-white text-3xl">✕</button>
          </>
        )}
      </div>
    </div>
  )
}