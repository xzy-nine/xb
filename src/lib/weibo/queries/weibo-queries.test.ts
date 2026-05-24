import { describe, expect, it } from 'vitest'

import {
  longTextQueryOptions,
  nestedCommentsQueryOptions,
  statusCommentsInfiniteOptions,
  statusDetailQueryOptions,
} from '@/lib/weibo/queries/weibo-queries'

describe('weibo query options', () => {
  it('centralizes status detail query key and enabled semantics', () => {
    expect(statusDetailQueryOptions('abc').queryKey).toEqual(['weibo', 'status', 'abc'])
    expect(statusDetailQueryOptions('abc').enabled).toBe(true)
    expect(statusDetailQueryOptions(null).enabled).toBe(false)
    expect(statusDetailQueryOptions('abc', false).enabled).toBe(false)
  })

  it('centralizes status comments pagination semantics', () => {
    const options = statusCommentsInfiniteOptions('status-1', 'author-1', 'flow=1')

    expect(options.queryKey).toEqual(['weibo', 'status-comments', 'status-1', 'flow=1'])
    expect(options.initialPageParam).toBeNull()
    expect(options.getNextPageParam({ items: [], nextCursor: 'next' })).toBe('next')
    expect(options.getNextPageParam({ items: [], nextCursor: null })).toBeUndefined()
  })

  it('centralizes nested comments enabled semantics', () => {
    expect(nestedCommentsQueryOptions('comment-1', 'author-1', true).queryKey).toEqual([
      'weibo',
      'nested-comments',
      'comment-1',
    ])
    expect(nestedCommentsQueryOptions('comment-1', 'author-1', true).enabled).toBe(true)
    expect(nestedCommentsQueryOptions('', 'author-1', true).enabled).toBe(false)
    expect(nestedCommentsQueryOptions('comment-1', '', true).enabled).toBe(false)
    expect(nestedCommentsQueryOptions('comment-1', 'author-1', false).enabled).toBe(false)
  })

  it('centralizes long text cache semantics', () => {
    const options = longTextQueryOptions('mblog-1', true)

    expect(options.queryKey).toEqual(['weibo', 'longtext', 'mblog-1'])
    expect(options.enabled).toBe(true)
    expect(options.staleTime).toBe(30 * 60 * 1000)
    expect(options.retry).toBe(false)
    expect(longTextQueryOptions(null, true).enabled).toBe(false)
    expect(longTextQueryOptions('mblog-1', false).enabled).toBe(false)
  })
})
