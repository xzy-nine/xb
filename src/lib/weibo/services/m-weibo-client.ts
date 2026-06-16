import type { MweiboFetchResponse } from '@/lib/weibo/platform/messages'
import { MweiboCaptchaError } from '@/lib/weibo/services/mweibo-errors'

const SEND_MESSAGE_RETRIES = 3
const RETRY_DELAY_MS = 300

/**
 * Inspect an m.weibo.cn response payload and return the captcha URL if
 * the server is gating the request behind its captcha interceptor.
 *
 * Captcha responses have shape:
 *   { ok: -100, errno: '-100', msg: '', url: 'https://m.weibo.cn/captcha/show?...', extra: '' }
 */
export function detectMweiboCaptcha(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>
  if (obj.ok !== -100) return null
  if (typeof obj.url !== 'string') return null
  if (!obj.url.includes('/captcha/')) return null
  return obj.url
}

async function ensureBackgroundReady(): Promise<void> {
  // Ping the background to ensure the service worker is awake.
  // MV3 service workers can be idle and need a moment to start up.
  try {
    await browser.runtime.sendMessage({ type: 'mweibo-ping' })
  } catch {
    // Ping may fail or return undefined — that's fine, SW is now waking up
  }
}

export async function mweiboFetch<T>(url: string): Promise<T> {
  await ensureBackgroundReady()

  let lastError: Error | null = null

  for (let attempt = 0; attempt < SEND_MESSAGE_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
    }

    try {
      const response = (await browser.runtime.sendMessage({
        type: 'mweibo-fetch',
        url,
      })) as MweiboFetchResponse | undefined

      if (!response) {
        lastError = new Error('mweibo-fetch-no-response')
        continue
      }

      if (!response.ok || response.error) {
        throw new Error(response.error ?? 'mweibo-fetch-failed')
      }

      const captchaUrl = detectMweiboCaptcha(response.data)
      if (captchaUrl) {
        throw new MweiboCaptchaError(captchaUrl)
      }

      return response.data as T
    } catch (error) {
      if (error instanceof MweiboCaptchaError) throw error
      if (error instanceof Error && error.message.startsWith('mweibo-fetch-failed')) {
        throw error
      }
      lastError = error instanceof Error ? error : new Error('mweibo-fetch-unknown-error')
    }
  }

  throw lastError ?? new Error('mweibo-fetch-no-response')
}

export function buildTopicSearchUrl(topic: string, page: number, channelType?: string): string {
  const type = channelType ?? '1'
  const containerid = `231522type=${type}&q=#${topic}#`
  const params = new URLSearchParams({
    containerid,
    page_type: 'searchall',
    v_p: '42',
    page: String(page),
  })
  return `https://m.weibo.cn/api/container/getIndex?${params}`
}
