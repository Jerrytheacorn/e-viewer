
import type { E621Post } from '../types/e621';

export type Platform = 'e621' | 'r34';

const BASES = {
  e621: 'https://e621.net',
  r34: 'https://api.rule34.xxx'
};

// Optional proxy base (set VITE_PROXY_URL in .env to something like http://localhost:3001/proxy?url=)
// Default to local proxy in dev for convenience
const PROXY: string | undefined = (import.meta.env.VITE_PROXY_URL as string | undefined) || (import.meta.env.DEV ? 'http://localhost:3001/proxy?url=' : undefined)

function maybeProxy(url: string) {
  if (!PROXY) return url
  return `${PROXY}${encodeURIComponent(url)}`
}

export async function searchPosts(query: string, platform: Platform = 'e621', limit = 100) {
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
  } else if (platform === 'r34') {
    const url = `${BASES.r34}/index.php?page=dapi&s=post&q=index&json=1&limit=${limit}&tags=${encodeURIComponent(query)}`;
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
  return [];
}
