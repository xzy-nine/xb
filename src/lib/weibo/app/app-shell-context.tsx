import { createContext, type ReactNode, useContext } from 'react'

import type { HomeTab } from '@/lib/app-settings'
import type { ComposeTarget } from '@/lib/weibo/models/compose'
import type { StatusDetailNavigationItem } from '@/lib/weibo/models/feed'
import type { WeiboPageDescriptor } from '@/lib/weibo/route/page-descriptor'

/** 单列页面通过外壳获取的全局动作。 */
export interface AppShellActions {
  navigateToStatusDetail: (item: StatusDetailNavigationItem) => void
  openStatusDetailDialog: (item: StatusDetailNavigationItem) => void
  navigateToProfile: (lookup: { uid: string } | { screenName: string }) => void
  openProfileDialog: (lookup: { uid: string } | { screenName: string }) => void
  openTopicDialog: (topic: string) => void
  resetMainScroll: () => void
  scrollMainToTop: () => void
}

export interface AppShellContextValue extends AppShellActions {
  page: WeiboPageDescriptor
  composeTarget: ComposeTarget | null
  setComposeTarget: (target: ComposeTarget | null) => void
  viewingProfileUserId: string | null
  onProfileUserIdChange: (userId: string | null) => void
  onHomeTabChange: (tab: HomeTab) => void
  refreshTimeline: () => void
  onFollowGroupChange: (gid: string | null) => void
}

const AppShellContext = createContext<AppShellContextValue | null>(null)

export function AppShellContextProvider({
  children,
  value,
}: {
  children: ReactNode
  value: AppShellContextValue
}) {
  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
}

const FALLBACK_SHELL_CONTEXT: AppShellContextValue = {
  page: { kind: 'unsupported', reason: 'unmatched-path' },
  navigateToStatusDetail: () => undefined,
  openStatusDetailDialog: () => undefined,
  navigateToProfile: () => undefined,
  openProfileDialog: () => undefined,
  openTopicDialog: () => undefined,
  resetMainScroll: () => undefined,
  scrollMainToTop: () => undefined,
  composeTarget: null,
  setComposeTarget: () => undefined,
  viewingProfileUserId: null,
  onProfileUserIdChange: () => undefined,
  onHomeTabChange: () => undefined,
  refreshTimeline: () => undefined,
  onFollowGroupChange: () => undefined,
}

/** 组件可能同时渲染在主列与辅助列，缺少 Provider 时退回空实现而不是中断渲染。 */
export function useAppShellContext(): AppShellContextValue {
  return useContext(AppShellContext) ?? FALLBACK_SHELL_CONTEXT
}
