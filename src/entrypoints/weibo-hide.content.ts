import '@/lib/weibo/content/weibo-anti-flash.css'

/**
 * Hides Weibo's native UI until the React app is ready.
 */
export default defineContentScript({
  matches: ['https://weibo.com/*', 'https://www.weibo.com/*'],
  runAt: 'document_start',
  main() {
    const style = document.createElement('style')
    style.textContent = /* css */ `
      body { visibility: hidden !important; }
      html[data-xb-weibo-ready] body,
      html[data-xb-weibo-ready] #app { visibility: visible !important; }
    `
    const target = document.head || document.documentElement
    if (target) {
      target.append(style)
    }
  },
})
