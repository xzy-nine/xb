import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppSettings } from '@/lib/app-settings-store'
import { useAppShellContext } from '@/lib/weibo/app/app-shell-layout'
import { FeedList } from '@/lib/weibo/components/feed-list'
import { PageErrorState, PageLoadingState } from '@/lib/weibo/components/page-state'
import { composeTargetFromFeedItem } from '@/lib/weibo/models/compose'
import type { FeedItem, TimelinePage } from '@/lib/weibo/models/feed'
import {
  flattenInfiniteItems,
  exploreGroupsQueryOptions,
  exploreTimelineInfiniteOptions,
} from '@/lib/weibo/queries/weibo-queries'
import { useWeiboPage } from '@/lib/weibo/route/use-weibo-page'
import type { ExploreGroup } from '@/lib/weibo/services/adapters/explore-groups'

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

  const items = flattenInfiniteItems<FeedItem>(
    timelineQuery.data?.pages as TimelinePage[] | undefined,
  )

  const errorMessage = timelineQuery.error instanceof Error ? timelineQuery.error.message : null
  const hasNextPage = Boolean(timelineQuery.hasNextPage)
  const isFetchingNextPage = timelineQuery.isFetchingNextPage
  const isLoading = timelineQuery.isLoading

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void timelineQuery.fetchNextPage()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, timelineQuery])

  const handleGroupClick = (group: ExploreGroup) => {
    navigate(`/hot/weibo/${group.gid}`)
  }

  return (
    <Tabs
      value={groupId}
      className="flex flex-col"
      onValueChange={(value) => {
        const group = groups.find((g) => g.gid === value)
        if (group) {
          handleGroupClick(group)
        }
      }}
    >
      <div className="bg-muted/60 sticky top-0 z-10 backdrop-blur">
        {groupsQuery.isLoading ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : groupsQuery.error ? (
          <PageErrorState description="加载分组失败" onRetry={() => void groupsQuery.refetch()} />
        ) : groups.length === 0 ? (
          <TabsList className="grid w-full grid-cols-2" variant="line">
            <TabsTrigger value="102803">热门</TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="flex w-full justify-start gap-2 overflow-x-auto pb-2" variant="line">
            {groups.map((group) => (
              <TabsTrigger key={group.gid} value={group.gid}>
                {group.title}
              </TabsTrigger>
            ))}
          </TabsList>
        )}
      </div>

      <TabsContent value={groupId} className="flex flex-col gap-3">
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
        {hasNextPage && !isFetchingNextPage ? (
          <Button variant="outline" onClick={() => void timelineQuery.fetchNextPage()}>
            加载下一页
          </Button>
        ) : null}
      </TabsContent>
    </Tabs>
  )
}
