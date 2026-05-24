import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'

import type { FeedItem } from '@/lib/weibo/models/feed'
import type { CommentItem } from '@/lib/weibo/models/status'
import {
  optimisticallyIncrementStatusComments,
  optimisticallyToggleCommentLike,
  optimisticallyToggleStatusFavorite,
  optimisticallyToggleStatusLike,
  restoreStatusCacheMutation,
} from '@/lib/weibo/queries/status-cache'

function createFeedItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: 'status-1',
    mblogId: 'mblog-1',
    isLongText: false,
    liked: false,
    favorited: false,
    author: { id: 'user-1', name: 'Alice', avatarUrl: null },
    text: 'hello',
    createdAt: '',
    createdAtLabel: '',
    stats: { likes: 1, comments: 2, reposts: 3 },
    images: [],
    media: null,
    ...overrides,
  }
}

function createCommentItem(overrides: Partial<CommentItem> = {}): CommentItem {
  return {
    id: 'comment-1',
    text: 'comment',
    createdAtLabel: '',
    author: { id: 'user-1', name: 'Alice', avatarUrl: null },
    likeCount: 1,
    liked: false,
    images: [],
    replyComment: null,
    comments: [],
    ...overrides,
  }
}

describe('status-cache', () => {
  it('toggles status like in feed pages, retweeted status, and status detail caches', async () => {
    const queryClient = new QueryClient()
    const root = createFeedItem({
      id: 'root',
      liked: false,
      stats: { likes: 1, comments: 0, reposts: 0 },
    })
    const retweeted = createFeedItem({
      id: 'retweeted',
      liked: false,
      stats: { likes: 5, comments: 0, reposts: 0 },
    })
    const wrapper = createFeedItem({
      id: 'wrapper',
      retweetedStatus: retweeted,
    })

    queryClient.setQueryData(['weibo', 'timeline'], { pages: [{ items: [root, wrapper] }] })
    queryClient.setQueryData(['weibo', 'status', 'retweeted'], { status: retweeted })

    await optimisticallyToggleStatusLike(queryClient, retweeted)

    const feed = queryClient.getQueryData<{ pages: Array<{ items: FeedItem[] }> }>([
      'weibo',
      'timeline',
    ])
    expect(feed?.pages[0]?.items[1]?.retweetedStatus?.liked).toBe(true)
    expect(feed?.pages[0]?.items[1]?.retweetedStatus?.stats.likes).toBe(6)
    expect(
      queryClient.getQueryData<{ status: FeedItem }>(['weibo', 'status', 'retweeted'])?.status
        .liked,
    ).toBe(true)
  })

  it('toggles status favorite and can restore the previous snapshot', async () => {
    const queryClient = new QueryClient()
    const item = createFeedItem({ id: 'status-1', favorited: false })
    queryClient.setQueryData(['weibo', 'timeline'], { pages: [{ items: [item] }] })

    const context = await optimisticallyToggleStatusFavorite(queryClient, item)
    expect(
      queryClient.getQueryData<{ pages: Array<{ items: FeedItem[] }> }>(['weibo', 'timeline'])
        ?.pages[0]?.items[0]?.favorited,
    ).toBe(true)

    restoreStatusCacheMutation(queryClient, context)
    expect(
      queryClient.getQueryData<{ pages: Array<{ items: FeedItem[] }> }>(['weibo', 'timeline'])
        ?.pages[0]?.items[0]?.favorited,
    ).toBe(false)
  })

  it('increments status comments in feed pages and status detail caches', async () => {
    const queryClient = new QueryClient()
    const item = createFeedItem({ id: 'status-1', stats: { likes: 0, comments: 2, reposts: 0 } })
    queryClient.setQueryData(['weibo', 'timeline'], { pages: [{ items: [item] }] })
    queryClient.setQueryData(['weibo', 'status', 'status-1'], { status: item })

    await optimisticallyIncrementStatusComments(queryClient, 'status-1')

    expect(
      queryClient.getQueryData<{ pages: Array<{ items: FeedItem[] }> }>(['weibo', 'timeline'])
        ?.pages[0]?.items[0]?.stats.comments,
    ).toBe(3)
    expect(
      queryClient.getQueryData<{ status: FeedItem }>(['weibo', 'status', 'status-1'])?.status.stats
        .comments,
    ).toBe(3)
  })

  it('toggles nested comment like in comment pages', async () => {
    const queryClient = new QueryClient()
    const child = createCommentItem({ id: 'child', likeCount: 4, liked: false })
    const parent = createCommentItem({ id: 'parent', comments: [child] })
    queryClient.setQueryData(['weibo', 'status-comments', 'status-1'], {
      pages: [{ items: [parent] }],
    })

    await optimisticallyToggleCommentLike(queryClient, child)

    const comments = queryClient.getQueryData<{ pages: Array<{ items: CommentItem[] }> }>([
      'weibo',
      'status-comments',
      'status-1',
    ])
    expect(comments?.pages[0]?.items[0]?.comments[0]?.liked).toBe(true)
    expect(comments?.pages[0]?.items[0]?.comments[0]?.likeCount).toBe(5)
  })
})
