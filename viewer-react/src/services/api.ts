import type { E621Post } from '../types/e621';
import type { PlatformSettings } from '../types/settings';

export type Platform = 'e621' | 'r34' | 'paheal' | 'r34us';

const BASES = {
  e621: 'https://e621.net',
  r34: 'https://api.rule34.xxx',
  paheal: 'https://rule34.paheal.net/api',
  r34us: 'https://rule34.us/index.php'
};

// Optional proxy base (set VITE_PROXY_URL in .env to something like http://localhost:3001/proxy?url=)
// Default to local proxy in dev for convenience
const PROXY: string | undefined = (import.meta.env.VITE_PROXY_URL as string | undefined) || (import.meta.env.DEV ? 'http://localhost:3001/proxy?url=' : undefined)

function maybeProxy(url: string) {
  if (!PROXY) return url
  return `${PROXY}${encodeURIComponent(url)}`
}

// Add credentials to URL if available
function addCredentials(url: string, platform: Platform, settings?: PlatformSettings) {
  if (!settings) return url;
  
  const platformMap: Record<Platform, keyof PlatformSettings> = {
    e621: 'r34', // e621 doesn't use settings
    r34: 'r34',
    paheal: 'paheal',
    r34us: 'r34us'
  };
  
  const credKey = platformMap[platform];
  const creds = settings[credKey];
  if (!creds || (!creds.user && !creds.key)) return url;

  const urlObj = new URL(url);
  if (creds.user) urlObj.searchParams.set('user', creds.user);
  if (creds.key) urlObj.searchParams.set('key', creds.key);
  
  return urlObj.toString();
}

export async function searchPosts(query: string, platform: Platform = 'e621', limit = 100, settings?: PlatformSettings) {
  if (!query) return []

  if (platform === 'e621') {
    const url = `${BASES.e621}/posts.json?limit=${limit}&tags=${encodeURIComponent(query)}`;
    const fetchUrl = maybeProxy(url)
    const res = await fetch(fetchUrl, {
      headers: { 'User-Agent': 'e621-viewer-react/0.1 (+https://example.com)' }
    });
    if (!res.ok) throw new Error('e621 search failed: ' + res.status);
    const data = await res.json();
    return (data.posts as any[]).map((p) => ({
      ...p,
      file: {
        ...p.file,
        type: p.file.ext === 'webm' || p.file.ext === 'mp4' ? 'video' : 'image',
        video_url: (p.file.ext === 'webm' || p.file.ext === 'mp4') ? p.file.url : undefined
      }
    })) as E621Post[];
  } 
  
  else if (platform === 'r34') {
    let url = `${BASES.r34}/index.php?page=dapi&s=post&q=index&json=1&limit=${limit}&tags=${encodeURIComponent(query)}`;
    url = addCredentials(url, platform, settings);
    const fetchUrl = maybeProxy(url)
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error('r34 search failed: ' + res.status);
    const data = await res.json();

    // Rule34 may return a short string when authentication is required
    if (typeof data === 'string' && data.toLowerCase().includes('missing authentication')) {
      throw new Error('Rule34 API: Missing authentication - API requires credentials or an API key.');
    }

    // Normalize to E621Post shape
    return (Array.isArray(data) ? data : []).map((p: any) => {
      const ext = (p.file_url || '').split('.').pop()?.toLowerCase();
      const isVideo = ext === 'webm' || ext === 'mp4';
      return {
        id: Number(p.id),
        file: {
          url: p.file_url,
          preview_url: p.preview_url || p.sample_url,
          type: isVideo ? 'video' : 'image',
          video_url: isVideo ? p.file_url : undefined
        },
        tags: { general: (p.tags || '').split(' ') }
      };
    }) as E621Post[];
  }
  
  else if (platform === 'paheal') {
    // Paheal uses XML API by default, we'll try to parse it or use their search
    let url = `${BASES.paheal}/danbooru/find_posts/index.xml?tags=${encodeURIComponent(query)}&limit=${limit}`;
    url = addCredentials(url, platform, settings);
    const fetchUrl = maybeProxy(url);
    
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error('Paheal search failed: ' + res.status);
    
    const text = await res.text();
    
    // Basic XML parsing for Paheal
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/xml');
    const posts = doc.querySelectorAll('post');
    
    return Array.from(posts).map(post => {
      const fileUrl = post.getAttribute('file_url') || '';
      const previewUrl = post.getAttribute('preview_url') || '';
      const tags = post.getAttribute('tags') || '';
      const id = post.getAttribute('id') || '0';
      
      const ext = fileUrl.split('.').pop()?.toLowerCase();
      const isVideo = ext === 'webm' || ext === 'mp4';
      
      return {
        id: Number(id),
        file: {
          url: fileUrl,
          preview_url: previewUrl,
          type: isVideo ? 'video' : 'image',
          video_url: isVideo ? fileUrl : undefined
        },
        tags: { general: tags.split(' ').filter(t => t) }
      };
    }) as E621Post[];
  }
  
  else if (platform === 'r34us') {
    let url = `${BASES.r34us}?page=dapi&s=post&q=index&json=1&limit=${limit}&tags=${encodeURIComponent(query)}`;
    url = addCredentials(url, platform, settings);
    const fetchUrl = maybeProxy(url);
    
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error('Rule34.us search failed: ' + res.status);
    
    const data = await res.json();
    
    if (typeof data === 'string') {
      throw new Error('Rule34.us: ' + data);
    }
    
    // Normalize to E621Post shape (similar to r34)
    return (Array.isArray(data) ? data : []).map((p: any) => {
      const ext = (p.file_url || '').split('.').pop()?.toLowerCase();
      const isVideo = ext === 'webm' || ext === 'mp4';
      return {
        id: Number(p.id),
        file: {
          url: p.file_url,
          preview_url: p.preview_url || p.sample_url,
          type: isVideo ? 'video' : 'image',
          video_url: isVideo ? p.file_url : undefined
        },
        tags: { general: (p.tags || '').split(' ') }
      };
    }) as E621Post[];
  }
  
  return [];
}