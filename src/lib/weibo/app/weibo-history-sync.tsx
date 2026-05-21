/**
 * Formerly synced host-page route changes into React Router.
 * Now a no-op — the host SPA's UI is hidden, so its navigations
 * are irrelevant.  The history bridge (installHistoryBridge)
 * still posts route-change messages, but nothing consumes them.
 */
export function WeiboHistorySync() {
  return null
}
