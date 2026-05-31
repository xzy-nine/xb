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
      /* Non-search pages: reveal #app once ready */
      html[data-xb-weibo-ready] body,
      html[data-xb-weibo-ready] #app { visibility: visible !important; }
      /* Search pages: reveal #pl_feed_main (contains #pl_feedlist_index) */
      // html[data-xb-weibo-ready] .wbs-feed { visibility: visible !important; }
    `
    const appendStyle = () => {
      const target = document.head || document.documentElement
      target.append(style)
    }

    if (document.head) {
      appendStyle()
    } else {
      const observer = new MutationObserver(() => {
        if (document.head) {
          observer.disconnect()
          appendStyle()
        }
      })
      observer.observe(document.documentElement, { childList: true })
    }
  },
})
