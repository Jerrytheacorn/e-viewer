
import React, { useState } from 'react'
import SearchBar from '../components/SearchBar'
import SearchPreview from '../components/SearchPreview'
import ImageGrid from '../components/ImageGrid'
import ImageModal from '../components/ImageModal'
import Slideshow from '../components/Slideshow'
import { useSearch } from '../hooks/useSearch'
import type { E621Post } from '../types/e621'

export default function Home(){
  const [query, setQuery] = useState('wolf')
  const [selected, setSelected] = useState<E621Post | null>(null)
  const [platform, setPlatform] = useState<'e621' | 'r34'>('e621')
  const [limit, setLimit] = useState(80)
  const [nsfwOnly, setNsfwOnly] = useState(true)
  const [randomMode, setRandomMode] = useState(false)
  const [slideshowOpen, setSlideshowOpen] = useState(false)
  const [slideshowStart, setSlideshowStart] = useState(0)

  // Build composed query similar to the old script: rating prefix for e621 and optional order:random
  let composedQuery = query || ''
  if (platform === 'e621') {
    const ratingPrefix = nsfwOnly ? 'rating:e' : 'rating:s'
    // if query already contains rating or order, don't duplicate
    if (!composedQuery.includes('rating:') && !composedQuery.includes('order:')) {
      composedQuery = ratingPrefix + (composedQuery ? ' ' + composedQuery : '')
    }
  }
  if (randomMode && !composedQuery.includes('order:random')) {
    composedQuery = 'order:random ' + composedQuery
  }

  // fetch posts when query or platform changes
  // pass limit to hook
  const { data, isLoading, isError, error } = useSearch(composedQuery, platform, limit, !!composedQuery.trim())
  const posts: E621Post[] = data || []

  const [apiError, setApiError] = useState<string | null>(null)

  // surface react-query errors
  React.useEffect(() => {
    if (error) setApiError((error as Error).message || String(error))
    else setApiError(null)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex gap-4 mb-4 items-center">
  <SearchBar value={query} onChange={setQuery} onSearch={(q) => setQuery(q)} />
        <select value={platform} onChange={e => setPlatform(e.target.value as 'e621' | 'r34')} className="p-2 rounded bg-gray-800">
          <option value="e621">e621</option>
          <option value="r34">Rule34.xxx</option>
        </select>
        <select value={limit} onChange={e => setLimit(Number(e.target.value))} className="p-2 rounded bg-gray-800">
          <option value={20}>20</option>
          <option value={40}>40</option>
          <option value={80}>80</option>
          <option value={160}>160</option>
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={nsfwOnly} onChange={e => setNsfwOnly(e.target.checked)} /> NSFW
        </label>
        <button className="p-2 bg-indigo-600 rounded" onClick={() => { setRandomMode(r => !r); if (randomMode) setQuery('order:random') }}>Random</button>
      </div>

      {/* Inline preview (top few results) */}
  {apiError && (
    <div className="mb-4 p-3 bg-red-800 text-red-100 rounded">
      <div className="flex justify-between items-center">
        <div>{apiError}</div>
        <button className="ml-4 text-sm underline" onClick={() => setApiError(null)}>Dismiss</button>
      </div>
    </div>
  )}
  <SearchPreview posts={posts.slice(0, 12)} onSelect={(p: E621Post) => {
    const tags = (p.tags?.general || []).slice(0, 6).join(' ')
    if (tags) setQuery(tags)
  }} />

      {/* Main grid */}
          <div className="mt-6">
      <ImageGrid posts={posts} loading={isLoading} onOpen={(p: E621Post) => { setSelected(p); setSlideshowStart(posts.findIndex(x => x.id === p.id)); setSlideshowOpen(true) }} />
          </div>

          <ImageModal post={selected} onClose={() => setSelected(null)} />
          {slideshowOpen && <Slideshow posts={posts} startIndex={slideshowStart} onClose={() => setSlideshowOpen(false)} />}
    </div>
  )
}
