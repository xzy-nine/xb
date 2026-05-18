export type NotificationTab = 'mentions' | 'comments' | 'likes'

export type WeiboPageDescriptor =
  | { kind: 'home'; tab: 'for-you' | 'following' }
  | { kind: 'status'; authorId: string; statusId: string }
  | {
      kind: 'profile'
      profileId: string
      profileSource: 'u' | 'n'
      tab: 'posts' | 'replies' | 'media'
    }
  | { kind: 'follow'; uid: string; tab: 'following' | 'fans' }
  | { kind: 'favorites'; uid: string }
  | { kind: 'notifications'; tab: NotificationTab }
  | { kind: 'explore'; groupId: string }
  | { kind: 'history' }
  | { kind: 'unsupported'; reason: 'invalid-url' | 'unmatched-path' }

export const PAGE_KINDS_WITH_SCROLL_RESTORATION: ReadonlySet<WeiboPageDescriptor['kind']> = new Set(
  ['home', 'profile', 'follow', 'favorites', 'notifications', 'explore', 'history'],
)
