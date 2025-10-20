import React from 'react'

type Props = {
  value: string
  onChange: (v: string) => void
  onSearch?: (v: string) => void
}

export default function SearchBar({ value, onChange, onSearch }: Props){
  return (
    <div className="mb-4 flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search tags..."
        className="p-2 rounded bg-gray-800 flex-1"
        onKeyDown={(e) => { if (e.key === 'Enter') onSearch && onSearch(value) }}
      />
      <button
        className="ml-2 p-2 bg-indigo-500 rounded"
        onClick={() => onSearch && onSearch(value)}
      >
        Search
      </button>
    </div>
  )
}
