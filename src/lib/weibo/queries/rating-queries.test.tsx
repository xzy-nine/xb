import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  batchRatingQueryOptions,
  myUserRatingQueryKey,
  myUserRatingQueryOptions,
  useRateUser,
  userRatingQueryKey,
  userRatingQueryOptions,
} from '@/lib/weibo/queries/rating-queries'
import { rateUser } from '@/lib/weibo/services/xb-server-client'

vi.mock('@/lib/weibo/services/xb-server-client', () => ({
  batchGetUserRatingSummaries: vi.fn(),
  getMyUserRating: vi.fn(),
  getUserRatingSummary: vi.fn(),
  rateUser: vi.fn(async () => ({ ok: true })),
}))

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('rating query options', () => {
  it('keeps public rating summaries fresh for one hour and my rating forever', () => {
    const oneHour = 60 * 60 * 1000

    expect(userRatingQueryOptions('1001').staleTime).toBe(oneHour)
    expect(batchRatingQueryOptions(['1001']).staleTime).toBe(oneHour)
    expect(myUserRatingQueryOptions('1001').staleTime).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('useRateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates only my rating and leaves the public average untouched', async () => {
    const queryClient = createQueryClient()
    const targetUid = '1001'

    queryClient.setQueryData(userRatingQueryKey(targetUid), {
      avg: 8.2,
      count: 3,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 },
    })
    queryClient.setQueryData(myUserRatingQueryKey(targetUid), { stars: 4 })

    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')
    const { result } = renderHook(() => useRateUser(), {
      wrapper: createWrapper(queryClient),
    })

    result.current.mutate({ targetUid, stars: 5 })

    await waitFor(() => {
      expect(queryClient.getQueryData(myUserRatingQueryKey(targetUid))).toEqual({ stars: 5 })
    })
    await waitFor(() => {
      expect(vi.mocked(rateUser)).toHaveBeenCalledWith({ target_uid: targetUid, stars: 5 })
    })

    expect(queryClient.getQueryData(userRatingQueryKey(targetUid))).toEqual({
      avg: 8.2,
      count: 3,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 },
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: myUserRatingQueryKey(targetUid),
    })
    expect(invalidateQueries).not.toHaveBeenCalledWith({
      queryKey: userRatingQueryKey(targetUid),
    })
  })
})
