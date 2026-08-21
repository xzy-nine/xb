type HistoryMethod = 'pushState' | 'replaceState'

/**
 * After a popstate (browser back/forward), the host page's SPA router may
 * call replaceState/pushState to rewrite the URL (e.g. Weibo's Vue Router
 * replaces /topic?q=<name> with /topic because it doesn't recognise the
 * parameterised path). This guard blocks those calls for a short window so
 * that React Router — which reads window.location on popstate — sees the
 * correct URL.
 *
 * Crucially, the popstate listener is registered with capture:true so it
 * fires BEFORE the host page's listeners (which are registered at page load
 * time, before this script runs). Without capture, our listener would fire
 * after the host's, and the guard would not be active when the host calls
 * replaceState.
 */
export function installHistoryBridge(targetWindow: Window) {
  let popstateHref: string | null = null

  const wrapHistoryMethod = (method: HistoryMethod) => {
    const original = targetWindow.history[method]

    Object.defineProperty(targetWindow.history, method, {
      configurable: true,
      writable: true,
      value: function patchedHistoryMethod(
        this: History,
        ...args: Parameters<History[HistoryMethod]>
      ) {
        if (popstateHref !== null && args[2] != null) {
          try {
            const resolved = new URL(args[2] as string, targetWindow.location.href).href
            if (resolved !== popstateHref) {
              return
            }
          } catch {
            // invalid URL — let it through
          }
        }
        const result = original.apply(this, args)
        return result
      },
    })
  }

  wrapHistoryMethod('pushState')
  wrapHistoryMethod('replaceState')

  // capture:true ensures this fires before the host page's popstate handlers
  targetWindow.addEventListener(
    'popstate',
    () => {
      popstateHref = targetWindow.location.href
      setTimeout(() => {
        popstateHref = null
      }, 50)
    },
    true,
  )

  // Intercept document.addEventListener('click', ...) so that any click handler
  // registered by the host page (Weibo) is wrapped with a guard that skips
  // processing when the click originates from our modal SmartLink elements.
  // This runs in the page context (MAIN world) and must execute BEFORE Weibo's
  // scripts register their listeners (weibo-main-world is loaded early).
  const documentAddEventListener = targetWindow.document.addEventListener.bind(
    targetWindow.document,
  )
  targetWindow.document.addEventListener = function (
    type: string,
    handler: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (type === 'click' && typeof handler === 'function') {
      const wrappedHandler: EventListener = (event: Event) => {
        const path = (event as MouseEvent).composedPath()
        for (const el of path) {
          if (el instanceof HTMLElement && el.dataset?.smartLink === 'modal') {
            return // Skip — click is on our UI, don't let host process it
          }
        }
        return (handler as EventListener)(event)
      }
      return documentAddEventListener(type, wrappedHandler as EventListener, options)
    }
    return documentAddEventListener(type, handler as EventListenerOrEventListenerObject, options)
  }
}
