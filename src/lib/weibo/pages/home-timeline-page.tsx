import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useAppSettings } from '@/lib/app-settings-store'
import { useAppShellContext } from '@/lib/weibo/app/app-shell-layout'
import { InfiniteFeedList } from '@/lib/weibo/components/infinite-feed-list'
import { NewPostsBubble } from '@/lib/weibo/components/new-posts-bubble'
import { TimelineTopBar, type TimelineTopBarOption } from '@/lib/weibo/components/timeline-top-bar'
import { composeTargetFromFeedItem } from '@/lib/weibo/models/compose'
import type { FeedItem, TimelinePage } from '@/lib/weibo/models/feed'
import {
  flattenInfiniteItems,
  followingNewPostsCheckOptions,
  homeTimelineInfiniteOptions,
  followGroupsQueryOptions,
} from '@/lib/weibo/queries/weibo-queries'
import { useWeiboPage } from '@/lib/weibo/route/use-weibo-page'

const HOME_TIMELINE_OPTIONS: TimelineTopBarOption[] = [
  { value: 'for-you', label: '推荐' },
  { value: 'following', label: '我关注的' },
]

function resetMainScrollAfterRouteChange(resetMainScroll: () => void) {
  requestAnimationFrame(() => {
    if (typeof resetMainScroll === 'function') {
      resetMainScroll()
    }
  })
}

export function HomeTimelinePage() {
  const ctx = useAppShellContext()
  const page = useWeiboPage()
  const queryClient = useQueryClient()
  const rewriteEnabled = useAppSettings((s) => s.rewriteEnabled)
  const followGroupsEnabled = useAppSettings((s) => s.followGroupsEnabled)

  const activeTab = page.kind === 'home' ? page.tab : 'for-you'
  const isEnabled = rewriteEnabled && page.kind === 'home'

  const groupIdFromUrl = page.kind === 'home' && page.groupId ? page.groupId : null
  const selectedGroupGid = groupIdFromUrl ?? 'default'

  const showGroupSelect = followGroupsEnabled && activeTab === 'following'

  const groupsQuery = useQuery({
    ...followGroupsQueryOptions,
    enabled: showGroupSelect,
  })

  const groupListId = showGroupSelect && selectedGroupGid !== 'default' ? selectedGroupGid : null
  const followingNewPostsGroupKey = groupListId ?? 'default'

  const timelineQuery = useInfiniteQuery({
    ...homeTimelineInfiniteOptions(activeTab, groupListId),
    enabled: isEnabled,
  })

  const items = useMemo(
    () => flattenInfiniteItems<FeedItem>(timelineQuery.data?.pages as TimelinePage[] | undefined),
    [timelineQuery.data?.pages],
  )

  const errorMessage = timelineQuery.error instanceof Error ? timelineQuery.error.message : null
  const hasNextPage = Boolean(timelineQuery.hasNextPage)
  const isFetchingNextPage = timelineQuery.isFetchingNextPage
  const isLoading = timelineQuery.isLoading
  const isRefreshing = timelineQuery.isFetching && !isFetchingNextPage && !isLoading

  const wasRefreshingRef = useRef(false)

  // ─── Scroll to top after refresh completes ───
  useEffect(() => {
    if (wasRefreshingRef.current && !isRefreshing) {
      ctx?.scrollMainToTop?.()
    }
    wasRefreshingRef.current = isRefreshing
  }, [isRefreshing, ctx])

  // ─── New posts check (following tab only) ───
  const followingFirstItemId = items.length > 0 && activeTab === 'following' ? items[0].id : null

  const newPostsCheckQuery = useQuery({
    ...followingNewPostsCheckOptions(followingFirstItemId, groupListId),
    enabled: isEnabled && activeTab === 'following' && followingFirstItemId !== null,
  })

  const dismissedNewPostsCheckAtByGroup = useRef<Record<string, number>>({})
  const dismissedForGroup = dismissedNewPostsCheckAtByGroup.current[followingNewPostsGroupKey] ?? 0
  const showNewPostsBubble =
    activeTab === 'following' &&
    Boolean(newPostsCheckQuery.data) &&
    !newPostsCheckQuery.isFetching &&
    newPostsCheckQuery.dataUpdatedAt > dismissedForGroup

  const handleNewPostsClick = useCallback(() => {
    dismissedNewPostsCheckAtByGroup.current[followingNewPostsGroupKey] =
      newPostsCheckQuery.dataUpdatedAt
    queryClient.setQueryData(
      ['weibo', 'timeline', 'following', followingNewPostsGroupKey, 'new-check'],
      null,
    )
    void queryClient.invalidateQueries({
      queryKey: ['weibo', 'timeline', 'following', followingNewPostsGroupKey],
      exact: true,
    })
  }, [queryClient, followingNewPostsGroupKey, newPostsCheckQuery.dataUpdatedAt])

  const handleGroupSelect = useCallback(
    (gid: string) => {
      if (gid === selectedGroupGid) return
      ctx.onFollowGroupChange(gid === 'default' ? null : gid)
      resetMainScrollAfterRouteChange(ctx.resetMainScroll)
    },
    [ctx, selectedGroupGid],
  )

  const handleTimelineChange = useCallback(
    (value: string) => {
      if (value === activeTab) return
      ctx.onHomeTabChange(value as 'for-you' | 'following')
      resetMainScrollAfterRouteChange(ctx.resetMainScroll)
    },
    [activeTab, ctx],
  )

  const groups = groupsQuery.data ?? []
  const activeTitle = activeTab === 'following' ? '我关注的' : '推荐'
  const groupOptions = showGroupSelect
    ? [
        { value: 'default', label: '全部分组' },
        ...groups.map((group) => ({ value: group.gid, label: group.title })),
      ]
    : []
  const selectedGroupLabel =
    groupOptions.find((option) => option.value === selectedGroupGid)?.label ?? '全部分组'

  return (
    <div className="relative">
      <TimelineTopBar
        title={activeTitle}
        titleValue={activeTab}
        titleOptions={HOME_TIMELINE_OPTIONS}
        onTitleChange={handleTimelineChange}
        filterLabel={showGroupSelect && groupOptions.length > 0 ? selectedGroupLabel : undefined}
        filterOptions={groupOptions}
        filterValue={showGroupSelect ? selectedGroupGid : undefined}
        onFilterChange={handleGroupSelect}
        onRefresh={() => void timelineQuery.refetch()}
        isRefreshing={isRefreshing}
      >
        {showNewPostsBubble ? (
          <div className="absolute top-[calc(100%+0.75rem)] left-1/2 z-20 -translate-x-1/2">
            <NewPostsBubble
              authors={newPostsCheckQuery.data?.authors ?? []}
              count={newPostsCheckQuery.data?.count ?? 0}
              onClick={handleNewPostsClick}
            />
          </div>
        ) : null}
      </TimelineTopBar>

      <div className="flex flex-col">
        <InfiniteFeedList
          pages={timelineQuery.data?.pages as TimelinePage[] | undefined}
          emptyLabel="此时间线暂无内容"
          loadingLabel="正在加载微博时间线..."
          errorMessage={errorMessage}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={timelineQuery.fetchNextPage}
          onRetry={() => void timelineQuery.refetch()}
          onNavigate={ctx.navigateToStatusDetail}
          onCommentClick={(item) =>
            ctx.setComposeTarget(composeTargetFromFeedItem(item, 'comment'))
          }
          onRepostClick={(item) => ctx.setComposeTarget(composeTargetFromFeedItem(item, 'repost'))}
          onCommentReply={ctx.setComposeTarget}
        />
      </div>
    </div>
  )
}
