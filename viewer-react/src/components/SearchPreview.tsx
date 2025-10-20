import React from 'react'
import type { E621Post } from '../types/e621'

export default function SearchPreview({ posts, onSelect }: { posts: E621Post[]; onSelect: (p: E621Post) => void }){
  if (!posts || posts.length === 0) return <div className="mt-4 text-sm text-gray-400">No previews</div>
  return (
    <div className="preview-grid mt-4">
      {posts.map(p => (
        <div key={p.id} className="preview-item" onClick={() => onSelect(p)}>
          <img src={p.file.preview_url || p.file.url} alt={p.tags?.general?.slice(0,3).join(', ') || ''} />
          <div className="preview-meta">{(p.tags?.general || []).slice(0,6).join(', ')}</div>
        </div>
      ))}
    </div>
  )
}