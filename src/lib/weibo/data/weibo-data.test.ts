import { describe, expect, it } from 'vitest'

import {
  exploreTimelineInfiniteOptions,
  FEED_INFINITE_QUERY_MAX_PAGES,
  homeTimelineInfiniteOptions,
} from '@/lib/weibo/data/weibo-data'

describe('feed infinite query cache policy', () => {
  it('bounds home timeline cached pages while preserving pagination policy', () => {
    const options = homeTimelineInfiniteOptions('following')

    expect(options.queryKey).toEqual(['weibo', 'timeline', 'following', 'default'])
    expect(options.initialPageParam).toBeNull()
    expect(options.maxPages).toBe(FEED_INFINITE_QUERY_MAX_PAGES)
    expect(options.staleTime).toBe(Infinity)
    expect(options.gcTime).toBe(Infinity)
  })

  it('bounds explore timeline cached pages while preserving pagination policy', () => {
    const options = exploreTimelineInfiniteOptions({
      gid: '102803',
      title: '热门',
      containerid: '102803',
    })

    expect(options.queryKey).toEqual(['weibo', 'explore', '102803'])
    expect(options.initialPageParam).toBeNull()
    expect(options.maxPages).toBe(FEED_INFINITE_QUERY_MAX_PAGES)
    expect(options.staleTime).toBe(Infinity)
    expect(options.gcTime).toBe(Infinity)
  })
})
