import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

import { wbGet, wbPostForm } from './client'

describe('client', () => {
  let originalPostMessage: typeof window.postMessage

  beforeEach(() => {
    originalPostMessage = window.postMessage
    window.postMessage = vi.fn()
  })

  afterEach(() => {
    window.postMessage = originalPostMessage
    vi.restoreAllMocks()
  })

  describe('wbGet', () => {
    it('sends GET request via postMessage', async () => {
      wbGet('/api/test', { page: 1 })

      expect(window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'xb',
          type: 'api-request',
          method: 'get',
          path: '/api/test',
          params: { page: 1 },
        }),
        '*',
      )
    })

    it('resolves with response data', async () => {
      const promise = wbGet<{ result: string }>('/api/test')

      // Simulate response
      setTimeout(() => {
        const call = (window.postMessage as any).mock.calls[0]
        const requestId = call[0].id

        window.dispatchEvent(
          new MessageEvent('message', {
            source: window,
            data: {
              source: 'xb',
              type: 'api-response',
              id: requestId,
              data: { result: 'success' },
            },
          }),
        )
      }, 0)

      const result = await promise
      expect(result).toEqual({ result: 'success' })
    })

    it('rejects on error response', async () => {
      const promise = wbGet('/api/test')

      setTimeout(() => {
        const call = (window.postMessage as any).mock.calls[0]
        const requestId = call[0].id

        window.dispatchEvent(
          new MessageEvent('message', {
            source: window,
            data: {
              source: 'xb',
              type: 'api-response',
              id: requestId,
              error: { status: 404, message: 'Not found' },
            },
          }),
        )
      }, 0)

      await expect(promise).rejects.toThrow('Not found')
    })

    it('rejects on timeout', async () => {
      vi.useFakeTimers()

      const promise = wbGet('/api/test')

      // Fast-forward past timeout
      vi.advanceTimersByTime(10001)

      await expect(promise).rejects.toThrow('weibo-request-timeout')

      vi.useRealTimers()
    })
  })

  describe('wbPostForm', () => {
    it('sends POST request via postMessage', async () => {
      wbPostForm('/api/submit', { content: 'test' })

      expect(window.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'xb',
          type: 'api-request',
          method: 'post',
          path: '/api/submit',
          body: { content: 'test' },
        }),
        '*',
      )
    })

    it('resolves with response data', async () => {
      const promise = wbPostForm<{ ok: number }>('/api/submit', { content: 'test' })

      setTimeout(() => {
        const call = (window.postMessage as any).mock.calls[0]
        const requestId = call[0].id

        window.dispatchEvent(
          new MessageEvent('message', {
            source: window,
            data: {
              source: 'xb',
              type: 'api-response',
              id: requestId,
              data: { ok: 1 },
            },
          }),
        )
      }, 0)

      const result = await promise
      expect(result).toEqual({ ok: 1 })
    })

    it('handles 401/403 unauthorized responses', async () => {
      const promise = wbPostForm('/api/submit', { content: 'test' })

      setTimeout(() => {
        const call = (window.postMessage as any).mock.calls[0]
        const requestId = call[0].id

        // Send error response with 401
        window.dispatchEvent(
          new MessageEvent('message', {
            source: window,
            data: {
              source: 'xb',
              type: 'api-response',
              id: requestId,
              error: { status: 401, message: 'Unauthorized' },
            },
          }),
        )

        // Should also trigger unauthorized event
        window.dispatchEvent(
          new MessageEvent('message', {
            source: window,
            data: {
              source: 'xb',
              type: 'api-unauthorized',
            },
          }),
        )
      }, 0)

      await expect(promise).rejects.toThrow('Unauthorized')
    })
  })
})
