export interface ExploreGroup {
  gid: string
  title: string
  containerid: string
}

export interface FollowGroup {
  gid: string
  title: string
}

interface ExploreGroupRaw {
  gid?: string
  title?: string
  containerid?: string
}

interface ExploreGroupsPayloadCategory {
  group?: ExploreGroupRaw[]
  title?: string
}

export interface ExploreGroupsPayload {
  groups?: ExploreGroupsPayloadCategory[]
}

export function adaptExploreGroupsResponse(payload: ExploreGroupsPayload): ExploreGroup[] {
  const list = payload.groups ?? []

  // Try to find "我的频道" category
  const myChannel = list.find((item) => item.title === '我的频道')

  let groups: ExploreGroupRaw[] = []

  if (myChannel && myChannel.group) {
    // Found "我的频道", use its list
    groups = myChannel.group ?? []
  }

  return groups as ExploreGroup[]
}

export function adaptFollowGroupsResponse(payload: ExploreGroupsPayload): FollowGroup[] {
  const list = payload.groups ?? []
  const myGroups = list.find((item) => item.title === '我的分组')
  if (!myGroups?.group) return []
  return myGroups.group
    .filter((g): g is ExploreGroupRaw & { gid: string; title: string } => Boolean(g.gid && g.title))
    .map(({ gid, title }) => ({ gid, title }))
}
