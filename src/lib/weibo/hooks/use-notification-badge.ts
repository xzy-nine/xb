import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { unreadNotificationsQueryOptions } from '@/lib/weibo/queries/weibo-queries'

// Kept for backward compatibility — the NavigationRail now uses the
// TanStack Query directly. This hook can be removed once nothing else
// depends on it.
export function useNotificationBadge() {
  const { data: counts } = useQuery(unreadNotificationsQueryOptions)

  useEffect(() => {
    if (!counts) return
    const total = counts.mentions + counts.comments + counts.likes
    browser.runtime.sendMessage({ type: 'UPDATE_BADGE', count: total }).catch(() => {})
  }, [counts])
}
