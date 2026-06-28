import { createHmac } from 'node:crypto'

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/weibo/platform/current-user', () => ({
  getCurrentUserUid: () => '6393557498',
}))

describe('xb-rating signing', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('adds the HMAC signature header when a signing secret is configured', async () => {
    vi.stubEnv('VITE_XB_SIGN_SECRET', 'test-secret')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-29T00:00:00Z'))

    const { userRatingQueryOptions } = await import('@/lib/weibo/rating/xb-rating')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ avg: 8.5, count: 10, distribution: {} }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await userRatingQueryOptions('target-uid').queryFn()

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

  it('omits the signature header when no signing secret is configured', async () => {
    vi.stubEnv('VITE_XB_SIGN_SECRET', '')
    vi.stubEnv('XB_SIGN_SECRET', '')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-29T00:00:00Z'))

    const { userRatingQueryOptions } = await import('@/lib/weibo/rating/xb-rating')
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ avg: 8.5, count: 10, distribution: {} }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await userRatingQueryOptions('target-uid').queryFn()

    const [, init] = mockFetch.mock.calls[0] as [string, { headers: Record<string, string> }]
    expect(init.headers).not.toHaveProperty('X-XB-Signature')
  })
})
