// code
-import Settings, { PlatformSettings } from '../components/Settings'
+//import Settings, { PlatformSettings } from '../components/Settings'
    import { useSearch } from '../hooks/useSearch'
    import type { E621Post } from '../types/e621'
    import type { Platform } from '../services/api'
import { useState } from 'react'
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
        const [settings, setSettings] = useState<PlatformSettings>(loadSettings());

        // Build composed query similar to the old script: rating prefix for e621 and optional order:random
        let composedQuery = query || '';
        if (platform === 'e621') {
            const ratingPrefix = nsfwOnly ? 'rating:e' : 'rating:s'; 
            // if query already contains rating or order, don't duplicate
            if (!composedQuery.includes('rating:') && !composedQuery.includes('order:')) {
                composedQuery = ratingPrefix + (composedQuery ? ' ' + composedQuery : '');
            } 
        }
        if (randomMode && !composedQuery.includes('order:random')) {
            composedQuery = 'order:random ' + composedQuery;
        }

        const search = useSearch(composedQuery, platform, limit, settings);

        // ... rest of the Home component code
    }