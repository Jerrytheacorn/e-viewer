import React from 'react'
import type { E621Post } from '../types/e621'

export default function ImageModal({ post, onClose }: { post: E621Post | null; onClose: () => void }){
  if (!post) return null
  const isVideo = post.file.type === 'video';
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="max-w-4xl max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video src={post.file.video_url || post.file.url} controls autoPlay className="max-h-[80vh] max-w-full bg-black" />
        ) : (
          <img src={post.file.url} alt={post.tags?.general?.slice(0,3).join(', ')} className="max-h-[80vh] max-w-full" />
        )}
      </div>
    </div>
  )
}
