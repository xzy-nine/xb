import { defineBackground } from 'wxt/utils/define-background'

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (
      typeof message === 'object' &&
      message !== null &&
      (message as Record<string, unknown>).type === 'UPDATE_BADGE'
    ) {
      const count = (message as { count?: number }).count ?? 0
      if (count > 0) {
        browser.action.setBadgeText({ text: count > 99 ? '99+' : String(count) })
        browser.action.setBadgeBackgroundColor({ color: '#ef4444' })
      } else {
        browser.action.setBadgeText({ text: '' })
      }
    }
  })
})
