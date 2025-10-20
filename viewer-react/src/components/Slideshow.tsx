import React, { useState, useEffect } from 'react'

export interface PlatformSettings {
  r34: { user?: string; key?: string }
  paheal: { user?: string; key?: string }
  r34us: { user?: string; key?: string }
}

interface Props {
  onClose: () => void
  settings: PlatformSettings
  onSave: (settings: PlatformSettings) => void
}

export default function Settings({ onClose, settings, onSave }: Props) {
  const [localSettings, setLocalSettings] = useState<PlatformSettings>(settings)

  const handleSave = () => {
    onSave(localSettings)
    onClose()
  }

  const updatePlatform = (platform: keyof PlatformSettings, field: 'user' | 'key', value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="space-y-6">
          {/* Rule34.xxx Settings */}
          <div className="border-b border-gray-700 pb-4">
            <h3 className="text-lg font-semibold mb-3">Rule34.xxx API</h3>
            <p className="text-sm text-gray-400 mb-3">
              Optional: Some content may require authentication. Get credentials at{' '}
              <a href="https://rule34.xxx" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                rule34.xxx
              </a>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={localSettings.r34.user || ''}
                  onChange={(e) => updatePlatform('r34', 'user', e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">API Key</label>
                <input
                  type="password"
                  value={localSettings.r34.key || ''}
                  onChange={(e) => updatePlatform('r34', 'key', e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="Enter API key"
                />
              </div>
            </div>
          </div>

          {/* Rule34 Paheal Settings */}
          <div className="border-b border-gray-700 pb-4">
            <h3 className="text-lg font-semibold mb-3">Rule34 Paheal</h3>
            <p className="text-sm text-gray-400 mb-3">
              Optional: Authentication for{' '}
              <a href="https://rule34.paheal.net" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                rule34.paheal.net
              </a>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={localSettings.paheal.user || ''}
                  onChange={(e) => updatePlatform('paheal', 'user', e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">API Key</label>
                <input
                  type="password"
                  value={localSettings.paheal.key || ''}
                  onChange={(e) => updatePlatform('paheal', 'key', e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="Enter API key"
                />
              </div>
            </div>
          </div>

          {/* Rule34.us Settings */}
          <div className="pb-4">
            <h3 className="text-lg font-semibold mb-3">Rule34.us</h3>
            <p className="text-sm text-gray-400 mb-3">
              Optional: Authentication for{' '}
              <a href="https://rule34.us" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                rule34.us
              </a>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Username</label>
                <input
                  type="text"
                  value={localSettings.r34us.user || ''}
                  onChange={(e) => updatePlatform('r34us', 'user', e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">API Key</label>
                <input
                  type="password"
                  value={localSettings.r34us.key || ''}
                  onChange={(e) => updatePlatform('r34us', 'key', e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white"
                  placeholder="Enter API key"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 p-3 bg-indigo-600 hover:bg-indigo-700 rounded font-semibold"
          >
            Save Settings
          </button>
          <button
            onClick={onClose}
            className="flex-1 p-3 bg-gray-700 hover:bg-gray-600 rounded font-semibold"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Settings are stored locally in your browser
        </p>
      </div>
    </div>
  )
}