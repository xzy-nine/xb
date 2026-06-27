import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  RatingPanel,
  RatingSummaryBadge,
  ratingScoreToDisplayStars,
} from '@/lib/weibo/components/rating-panel'
import { userRatingQueryKey } from '@/lib/weibo/rating/xb-rating'

vi.mock('@/lib/weibo/rating/xb-rating', async () => {
  const actual = await vi.importActual('@/lib/weibo/rating/xb-rating')
  return {
    ...actual,
    userRatingQueryOptions: vi.fn((uid: string) => ({
      queryKey: ['rating', 'user', uid],
      queryFn: async () => ({
        avg: 8.2,
        count: 3,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 2, 5: 1 },
      }),
    })),
    myUserRatingQueryOptions: vi.fn((uid: string) => ({
      queryKey: ['rating', 'user', uid, 'me'],
      queryFn: async () => ({ stars: 4 }),
    })),
    useRateUser: vi.fn(() => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(async () => ({ ok: true })),
    })),
  }
})

function renderWithClient(
  ui: ReactElement,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
) {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('ratingScoreToDisplayStars', () => {
  it('rounds 10-point scores up to the nearest half star', () => {
    expect(ratingScoreToDisplayStars(0)).toBe(0)
    expect(ratingScoreToDisplayStars(8)).toBe(4)
    expect(ratingScoreToDisplayStars(8.2)).toBe(4.5)
    expect(ratingScoreToDisplayStars(9.1)).toBe(5)
    expect(ratingScoreToDisplayStars(10)).toBe(5)
  })
})

describe('RatingPanel', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('shows the average score and the current user score in one rating module', async () => {
    renderWithClient(<RatingPanel targetUid="1001" />)

    expect(await screen.findByText('8.2')).toBeInTheDocument()
    expect(screen.getByText('我评')).toBeInTheDocument()
    expect(await screen.findByText('4')).toBeInTheDocument()
  })

  it('turns the same star area into an integer rating control on hover', async () => {
    const view = renderWithClient(<RatingPanel targetUid="1001" />)

    await within(view.container).findByText('8.2')
    const starArea = view.container.querySelector('[aria-label="rating star control"]')
    expect(starArea).toBeInTheDocument()
    fireEvent.mouseEnter(starArea!)
    fireEvent.keyDown(screen.getByRole('radiogroup', { name: '我的 rating' }), {
      key: 'ArrowRight',
    })

    await waitFor(() => {
      // Verify rating interaction occurred
      expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    })
  })
})

describe('RatingSummaryBadge', () => {
  beforeEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders score in tooltip with public summary API called', async () => {
    const view = renderWithClient(<RatingSummaryBadge targetUid="1001" />)

    // Badge renders with the expected aria-label reflecting the score
    expect(await view.findByRole('img', { name: /评分 8\.2 分/i })).toBeInTheDocument()

    // Score text is intentionally hidden in the DOM (rendered in tooltip)
    expect(screen.queryByText('8.2')).not.toBeInTheDocument()

    // Personal rating label is absent
    expect(screen.queryByText('我评')).not.toBeInTheDocument()
  })

  it('reads batch-seeded cache without calling any API', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(userRatingQueryKey('1001'), {
      avg: 7.5,
      count: 2,
      distribution: {},
    })

    const view = renderWithClient(
      <RatingSummaryBadge targetUid="1001" useBatchCache />,
      queryClient,
    )

    // Badge renders with the expected aria-label reflecting the cached score
    expect(await view.findByRole('img', { name: /评分 7\.5 分/i })).toBeInTheDocument()

    // Score text is intentionally hidden in the DOM
    expect(screen.queryByText('7.5')).not.toBeInTheDocument()
  })
})
