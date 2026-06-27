import { createHmac } from 'node:crypto'

import { afterEach, describe, expect, it, vi } from 'vitest'

describe('xb-rating signing', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('adds the HMAC signature header when a signing secret is configured', async () => {
    vi.stubEnv('VITE_XB_SIGN_SECRET', 'test-secret')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-29T00:00:00Z'))

    // Import after env is stubbed
    const xbRating = await import('./xb-rating')

    // We can't directly test the internal signXbServerRequest function,
    // but we can test that fetch is called with correct headers
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ avg: 8.5, count: 10, distribution: {} }),
    })
    global.fetch = mockFetch

    // Mock getCurrentUserUid
    vi.mock('@/lib/weibo/platform/current-user', () => ({
      getCurrentUserUid: () => '6393557498',
    }))

    // Call a function that uses signing
    try {
      await xbRating.userRatingQueryOptions('target-uid').queryFn()
    } catch {
      // Expected to fail in test environment, we just want to verify headers
    }

    const expectedPayload = '1780012800.6393557498./api/ratings/user/target-uid'
    const expectedSignature = createHmac('sha256', 'test-secret')
      .update(expectedPayload)
      .digest('hex')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ratings/user/target-uid'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-XB-UID': '6393557498',
          'X-XB-Timestamp': '1780012800',
          'X-XB-Signature': expectedSignature,
        }),
      }),
    )
  })
})
