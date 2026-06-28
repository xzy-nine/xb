import type { DefaultFollowGroups, DefaultFollowHomeTab, FollowGroup } from './explore'

export function getDefaultFollowGroupForHomeTab(
  defaultGroups: DefaultFollowGroups | null | undefined,
  tab: DefaultFollowHomeTab,
): FollowGroup | null {
  if (!defaultGroups) return null
  return tab === 'special-follow' ? defaultGroups.specialFollow : defaultGroups.friendCircle
}

export function getHomeTabForDefaultFollowGroupId(
  defaultGroups: DefaultFollowGroups | null | undefined,
  gid: string | null | undefined,
): DefaultFollowHomeTab | null {
  if (!defaultGroups || !gid) return null
  if (defaultGroups.specialFollow?.gid === gid) return 'special-follow'
  if (defaultGroups.friendCircle?.gid === gid) return 'friend-circle'
  return null
}
