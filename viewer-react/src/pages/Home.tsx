import React, { useState, useEffect } from 'react'
import SearchBar from '../components/SearchBar'
import SearchPreview from '../components/SearchPreview'
import ImageGrid from '../components/ImageGrid'
import ImageModal from '../components/ImageModal'
import Slideshow from '../components/Slideshow'
import Settings, { PlatformSettings } from '../components/Settings'
import { useSearch } from '../hooks/useSearch'
import type { E621Post } from '../types/e621'
import type { Platform } from '../services/api'

const SETTINGS_KEY = 'e621-viewer-settings';

function loadSettings(): PlatformSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return {
    r34: {},
    paheal: {},
    r34us: {}
  };
}

function saveSettings(settings: PlatformSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export default function Home(){
  const [query, setQuery] = useState('wolf')
  const [selected, setSelected] = useState<E621Post | null>(null)
  const [platform, setPlatform] = useState<Platform>('e621')
  const [limit, setLimit] = useState(80)
  const [nsfwOnly, setNsfwOnly] = useState(true)
  const [randomMode, setRandomMode] = useState(false)
  const [slideshowOpen, setSlideshowOpen] = useState(false)
  const [slideshowStart, setSlideshowStart] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<PlatformSettings>(loadSettings())

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
  // pass limit and settings to hook
  const { data, isLoading, isError, error } = useSearch(composedQuery, platform, limit, settings, !!composedQuery.trim())
  const posts: E621Post[] = data || []

  const [apiError, setApiError] = useState<string | null>(null)

  // surface react-query errors
  useEffect(() => {
    if (error) setApiError((error as Error).message || String(error))
    else setApiError(null)
  }, [error])

  const handleSaveSettings = (newSettings: PlatformSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex gap-4 mb-4 items-center flex-wrap">
        <SearchBar value={query} onChange={setQuery} onSearch={(q) => setQuery(q)} />
        <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} className="p-2 rounded bg-gray-800">
          <option value="e621">e621</option>
          <option value="r34">Rule34.xxx</option>
          <option value="paheal">Rule34 Paheal</option>
          <option value="r34us">Rule34.us</option>
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
        <button 
          className="p-2 bg-gray-700 rounded hover:bg-gray-600 flex items-center gap-2"
          onClick={() => setSettingsOpen(true)}
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
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
      {settingsOpen && <Settings settings={settings} onSave={handleSaveSettings} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}