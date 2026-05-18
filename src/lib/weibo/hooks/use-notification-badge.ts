import { useEffect, useRef } from 'react'

import { checkUnreadNotifications } from '@/lib/weibo/services/weibo-repository'

export function useNotificationBadge() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    async function poll() {
      try {
        const counts = await checkUnreadNotifications()
        const total = counts.mentions + counts.comments + counts.likes
        await browser.runtime.sendMessage({ type: 'UPDATE_BADGE', count: total }).catch(() => {})
      } catch {
        void 0
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 60_000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
}
