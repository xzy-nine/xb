export interface ExploreGroup {
  gid: string
  title: string
  containerid: string
}

export interface FollowGroup {
  gid: string
  title: string
}

export interface DefaultFollowGroups {
  specialFollow: FollowGroup | null
  friendCircle: FollowGroup | null
}

export interface FollowGroups {
  groups: FollowGroup[]
  defaultGroups: DefaultFollowGroups
}

export type DefaultFollowHomeTab = 'special-follow' | 'friend-circle'
