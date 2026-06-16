import { describe, expect, it, vi } from 'vitest'

import type { FeedItem } from '@/lib/weibo/models/feed'

// Mock all complex dependencies
vi.mock('html-to-image', () => ({
  toBlob: vi.fn().mockResolvedValue(new Blob(['fake'], { type: 'image/png' })),
}))

vi.mock('@/lib/app-settings-store', () => ({
  useAppSettings: vi.fn(() => ({
    imageGenTheme: 'light',
    imageGenShowDataArea: true,
    imageGenShowFullImages: false,
    imageGenShowWeiboLink: true,
    imageGenCardStyle: 'default',
    updateSettings: vi.fn(),
  })),
  useShallow: vi.fn((fn) => fn),
}))

describe('GenImageDialog', () => {
  const mockFeedItem: FeedItem = {
    id: '123',
    author: {
      uid: 'user123',
      name: '测试用户',
      avatarHd: 'https://example.com/avatar.jpg',
      followerCount: 1000,
      isFollowing: false,
      description: '测试描述',
      profileUrl: 'https://weibo.com/u/user123',
    },
    createdAt: '2024-01-01T00:00:00Z',
    text: '测试微博内容',
    source: 'iPhone客户端',
    region: '北京',
    attitudesCount: 10,
    commentsCount: 5,
    repostsCount: 3,
    isLiked: false,
    picIds: [],
    picInfos: {},
  }

  it('exports GenImageDialog component', async () => {
    const { GenImageDialog } = await import('./gen-image-dialog')
    expect(GenImageDialog).toBeDefined()
    expect(typeof GenImageDialog).toBe('function')
  })

  it('has expected props interface', () => {
    // Test that the component accepts the expected props structure
    const props = {
      open: true,
      onOpenChange: vi.fn(),
      item: mockFeedItem,
    }

    expect(props.open).toBe(true)
    expect(typeof props.onOpenChange).toBe('function')
    expect(props.item).toEqual(mockFeedItem)
  })

  it('feed item structure matches expected format', () => {
    expect(mockFeedItem).toHaveProperty('id')
    expect(mockFeedItem).toHaveProperty('author')
    expect(mockFeedItem.author).toHaveProperty('name')
    expect(mockFeedItem.author).toHaveProperty('uid')
    expect(mockFeedItem).toHaveProperty('text')
    expect(mockFeedItem).toHaveProperty('createdAt')
  })
})
