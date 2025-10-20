import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { searchPosts } from '../services/api'
import type { E621Post } from '../types/e621'

// Mock global fetch
const globalAny: any = global

describe('searchPosts', () => {
  beforeEach(() => {
    globalAny.fetch = vi.fn()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes e621 posts', async () => {
    const fake = {
      posts: [
        {
          id: 1,
          file: { url: 'https://static1.e621.net/data/foo.png', ext: 'png' },
          tags: { general: ['wolf', 'cute'] }
        }
      ]
    }
    ;(globalAny.fetch as any).mockResolvedValue({ ok: true, json: async () => fake })
    const res = await searchPosts('wolf', 'e621', 10)
    expect(res).toBeInstanceOf(Array)
    expect(res[0].id).toBe(1)
    expect(res[0].file.type).toBe('image')
  })

  it('normalizes r34 posts', async () => {
    const fake = [
      {
        id: '123',
        file_url: 'https://rule34.xxx/images/1.webp',
        preview_url: 'https://rule34.xxx/previews/1.jpg',
        tags: 'wolf cute'
      }
    ]
    ;(globalAny.fetch as any).mockResolvedValue({ ok: true, json: async () => fake })
    const res = await searchPosts('wolf', 'r34', 10)
    expect(res).toBeInstanceOf(Array)
    expect(res[0].id).toBe(123)
    expect(res[0].file.type).toBe('image')
    expect(res[0].file.preview_url).toBe('https://rule34.xxx/previews/1.jpg')
  })

  it('throws when r34 returns missing authentication string', async () => {
    ;(globalAny.fetch as any).mockResolvedValue({ ok: true, json: async () => 'Missing authentication. Go to api.rule34.xxx for more information' })
    await expect(searchPosts('wolf', 'r34', 10)).rejects.toThrow(/Missing authentication/i)
  })
})
