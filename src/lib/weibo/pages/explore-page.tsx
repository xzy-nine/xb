import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'

import { Spinner } from '@/components/ui/spinner'
import { useAppSettings } from '@/lib/app-settings-store'
import { useAppShellContext } from '@/lib/weibo/app/app-shell-layout'
import { FeedList } from '@/lib/weibo/components/feed-list'
import { PageErrorState, PageLoadingState } from '@/lib/weibo/components/page-state'
import { TimelineTopBar } from '@/lib/weibo/components/timeline-top-bar'
import { composeTargetFromFeedItem } from '@/lib/weibo/models/compose'
import type { FeedItem, TimelinePage } from '@/lib/weibo/models/feed'
import {
  flattenInfiniteItems,
  exploreGroupsQueryOptions,
  exploreTimelineInfiniteOptions,
} from '@/lib/weibo/queries/weibo-queries'
import { useWeiboPage } from '@/lib/weibo/route/use-weibo-page'
import type { ExploreGroup } from '@/lib/weibo/services/adapters/explore-groups'

function resetMainScrollAfterRouteChange(resetMainScroll: () => void) {
  requestAnimationFrame(resetMainScroll)
}

export function ExplorePage() {
  const ctx = useAppShellContext()
  const page = useWeiboPage()
  const navigate = useNavigate()
  const rewriteEnabled = useAppSettings((s) => s.rewriteEnabled)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const groupId = page.kind === 'explore' ? page.groupId : '102803'
  const isEnabled = rewriteEnabled && page.kind === 'explore'

  const groupsQuery = useQuery(exploreGroupsQueryOptions)
  const groups = groupsQuery.data ?? []
  const activeGroup = groups.find((g) => g.gid === groupId) ?? groups[0]

  const timelineQuery = useInfiniteQuery({
    ...exploreTimelineInfiniteOptions(
      activeGroup ?? {
        gid: groupId,
        containerid: groupId,
        title: '',
      },
    ),
    enabled: isEnabled && Boolean(activeGroup),
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

  const fetchNextPageRef = useRef(timelineQuery.fetchNextPage)
  fetchNextPageRef.current = timelineQuery.fetchNextPage

  const wasRefreshingRef = useRef(false)

  useEffect(() => {
    if (wasRefreshingRef.current && !isRefreshing) {
      ctx.scrollMainToTop()
    }
    wasRefreshingRef.current = isRefreshing
  }, [isRefreshing, ctx])

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPageRef.current()
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage])

  const handleGroupClick = (group: ExploreGroup) => {
    if (group.gid === groupId) return
    navigate(`/hot/weibo/${group.gid}`)
    resetMainScrollAfterRouteChange(ctx.resetMainScroll)
  }

  const groupOptions =
    groups.length > 0
      ? groups.map((group) => ({ value: group.gid, label: group.title }))
      : [{ value: '102803', label: '热门' }]
  const activeGroupLabel =
    activeGroup?.title ?? groupOptions.find((option) => option.value === groupId)?.label ?? '热门'

  return (
    <div className="flex flex-col">
      <TimelineTopBar
        title="探索"
        filterLabel={activeGroupLabel}
        filterOptions={groupOptions}
        filterValue={groupId}
        onFilterChange={(value) => {
          const group = groups.find((g) => g.gid === value)
          if (group) {
            handleGroupClick(group)
          }
        }}
        onRefresh={() => void timelineQuery.refetch()}
        isRefreshing={isRefreshing}
      />

      <div className="flex flex-col gap-3">
        {groupsQuery.isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : null}
        {groupsQuery.error ? (
          <PageErrorState description="加载分组失败" onRetry={() => void groupsQuery.refetch()} />
        ) : null}
        {isLoading ? <PageLoadingState label="正在加载探索内容..." /> : null}
        {!isLoading && errorMessage ? (
          <PageErrorState description={errorMessage} onRetry={() => void timelineQuery.refetch()} />
        ) : null}
        {!isLoading && !errorMessage ? (
          <FeedList
            items={items}
            emptyLabel="暂无内容"
            onNavigate={ctx.navigateToStatusDetail}
            onCommentClick={(item) =>
              ctx.setComposeTarget(composeTargetFromFeedItem(item, 'comment'))
            }
            onRepostClick={(item) =>
              ctx.setComposeTarget(composeTargetFromFeedItem(item, 'repost'))
            }
          />
        ) : null}
        {hasNextPage ? (
          <div ref={loadMoreRef} className="flex justify-center py-3">
            {isFetchingNextPage ? <Spinner size="sm" /> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
