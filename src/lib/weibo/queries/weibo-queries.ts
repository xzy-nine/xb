import type { HotSearchType } from '@/lib/app-settings'
import type { FeedAuthor, TimelinePage } from '@/lib/weibo/models/feed'
import type { WeiboPageDescriptor } from '@/lib/weibo/route/page-descriptor'
import type { ExploreGroup } from '@/lib/weibo/services/adapters/explore-groups'
import {
  loadExploreGroups,
  loadExploreHot,
  loadFavorites,
  loadHotSearchByType,
  loadHomeTimeline,
  loadProfilePosts,
  loadSearch,
  type HomeTimelineTab,
} from '@/lib/weibo/services/weibo-repository'

export function flattenInfiniteItems<Item>(pages: Array<{ items: Item[] }> | undefined): Item[] {
  return pages?.flatMap((page) => page.items) ?? []
}

export function profileLookupFromPage(page: WeiboPageDescriptor) {
  if (page.kind !== 'profile') {
    return null
  }

  return page.profileSource === 'u'
    ? ({ uid: page.profileId } as const)
    : ({ screenName: page.profileId } as const)
}

/** Result of checking for new posts on the "following" timeline. */
interface FollowingNewPostsCheck {
  /** Authors of the new posts (deduplicated, up to 5). */
  authors: FeedAuthor[]
  /** Total count of new posts found. */
  count: number
}

export function followingNewPostsCheckOptions(seenFirstItemId: string | null) {
  return {
    queryKey: ['weibo', 'timeline', 'following', 'new-check'] as const,
    queryFn: async () => {
      const page = await loadHomeTimeline('following')
      if (page.items.length === 0) {
        return null as FollowingNewPostsCheck | null
      }

      const newItems: typeof page.items = []
      for (const item of page.items) {
        if (item.id === seenFirstItemId) break
        newItems.push(item)
      }

      if (newItems.length === 0) {
        return null as FollowingNewPostsCheck | null
      }

      const seenAuthorIds = new Set<string>()
      const authors: FeedAuthor[] = []
      for (const item of newItems) {
        if (seenAuthorIds.has(item.author.id)) continue
        seenAuthorIds.add(item.author.id)
        authors.push(item.author)
        if (authors.length >= 5) break
      }

      return { authors, count: newItems.length } as FollowingNewPostsCheck
    },
    staleTime: 0,
    refetchInterval: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  }
}

export function homeTimelineInfiniteOptions(activeTimelineTab: HomeTimelineTab) {
  return {
    queryKey: ['weibo', 'timeline', activeTimelineTab] as const,
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      loadHomeTimeline(activeTimelineTab, { cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: TimelinePage) => lastPage.nextCursor ?? undefined,
    staleTime: Infinity,
    gcTime: Infinity,
  }
}

export function profilePostsInfiniteOptions(profileId: string) {
  return {
    queryKey: ['weibo', 'profile', 'posts', profileId] as const,
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      loadProfilePosts(profileId, pageParam ? Number(pageParam) : 1),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: TimelinePage) => lastPage.nextCursor ?? undefined,
    staleTime: 30 * 60 * 1000,
  }
}

export function favoritesInfiniteOptions(uid: string) {
  return {
    queryKey: ['weibo', 'favorites', uid] as const,
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      loadFavorites(uid, { page: pageParam ? Number(pageParam) : 1 }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: TimelinePage) => lastPage.nextCursor ?? undefined,
    staleTime: 30 * 60 * 1000,
  }
}

export function hotSearchQueryOptions(type: HotSearchType = 'hot') {
  return {
    queryKey: ['weibo', 'hotsearch', type],
    queryFn: () => loadHotSearchByType(type),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  }
}

export function searchQueryOptions(query: string) {
  return {
    queryKey: ['weibo', 'search', query] as const,
    queryFn: () => loadSearch(query),
    enabled: query.trim().length > 0,
    staleTime: 0,
  }
}

export function exploreTimelineInfiniteOptions(group: ExploreGroup) {
  return {
    queryKey: ['weibo', 'explore', group.gid] as const,
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      loadExploreHot({ cursor: pageParam, groupId: group.gid, containerid: group.containerid }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: TimelinePage) => lastPage.nextCursor ?? undefined,
    staleTime: Infinity,
    gcTime: Infinity,
  }
}

export const exploreGroupsQueryOptions = {
  queryKey: ['weibo', 'explore', 'groups'] as const,
  queryFn: () => loadExploreGroups(),
  staleTime: 5 * 60 * 1000,
}
