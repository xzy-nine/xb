import { defineBackground } from 'wxt/utils/define-background'

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'mweibo-fetch') {
      handleMweiboFetch(message as MweiboFetchMessage)
        .then(sendResponse)
        .catch((err: unknown) => {
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        })
      return true // async sendResponse
    }
  })
})

interface MweiboFetchMessage {
  type: 'mweibo-fetch'
  url: string
}

interface MweiboFetchResponse {
  ok: boolean
  data?: unknown
  error?: string
}

async function handleMweiboFetch(message: MweiboFetchMessage): Promise<MweiboFetchResponse> {
  const xsrfCookie = await browser.cookies.get({
    url: 'https://m.weibo.cn',
    name: 'XSRF-TOKEN',
  })

  const headers: Record<string, string> = {
    'x-requested-with': 'XMLHttpRequest',
    accept: 'application/json, text/plain, */*',
    ...(xsrfCookie?.value ? { 'x-xsrf-token': xsrfCookie.value } : {}),
  }

  const response = await fetch(message.url, {
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    return {
      ok: false,
      error: `mweibo-fetch-failed:${response.status}`,
    }
  }

  const data = await response.json()
  return { ok: true, data }
}
