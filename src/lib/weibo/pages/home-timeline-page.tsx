import { useIntersectionObserver } from '@reactuses/core'
import { useInfiniteQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppSettings } from '@/lib/app-settings-store'
import { cn } from '@/lib/utils'
import { useAppShellContext } from '@/lib/weibo/app/app-shell-layout'
import { FeedList } from '@/lib/weibo/components/feed-list'
import { PageErrorState, PageLoadingState } from '@/lib/weibo/components/page-state'
import { composeTargetFromFeedItem } from '@/lib/weibo/models/compose'
import type { FeedItem, TimelinePage } from '@/lib/weibo/models/feed'
import {
  flattenInfiniteItems,
  homeTimelineInfiniteOptions,
} from '@/lib/weibo/queries/weibo-queries'
import { useWeiboPage } from '@/lib/weibo/route/use-weibo-page'

interface RefreshTabTriggerProps {
  value: string
  label: string
  isActive: boolean
  onRefresh: () => void
  isRefreshing: boolean
}

function RefreshTabTrigger({
  value,
  label,
  isActive,
  onRefresh,
  isRefreshing,
}: RefreshTabTriggerProps) {
  const [isHovered, setIsHovered] = useState(false)

  const showRefresh = isActive && (isHovered || isRefreshing)

  return (
    <TabsTrigger
      value={value}
      className={cn('relative', isActive && showRefresh && 'text-foreground')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (isActive && !isRefreshing) {
          onRefresh()
        }
      }}
    >
      <AnimatePresence mode="wait">
        {showRefresh ? (
          <motion.span
            key="refresh"
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
            刷新
          </motion.span>
        ) : (
          <motion.span
            key="label"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </TabsTrigger>
  )
}

export function HomeTimelinePage() {
  const ctx = useAppShellContext()
  const page = useWeiboPage()
  const rewriteEnabled = useAppSettings((s) => s.rewriteEnabled)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const activeTab = page.kind === 'home' ? page.tab : 'for-you'
  const isEnabled = rewriteEnabled && page.kind === 'home'

  const timelineQuery = useInfiniteQuery({
    ...homeTimelineInfiniteOptions(activeTab),
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

  const fetchNextPageRef = useRef(timelineQuery.fetchNextPage)
  fetchNextPageRef.current = timelineQuery.fetchNextPage

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const wasRefreshingRef = useRef(false)

  useEffect(() => {
    if (wasRefreshingRef.current && !isRefreshing) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    wasRefreshingRef.current = isRefreshing
  }, [isRefreshing])

  useIntersectionObserver(
    loadMoreRef,
    (entries) => {
      if (entries[0]?.isIntersecting) {
        void fetchNextPageRef.current()
      }
    },
    { threshold: 0.2 },
  )

  return (
    <div>
      <Tabs
        value={activeTab}
        className="flex flex-col"
        onValueChange={(value) => ctx.onHomeTabChange(value as 'for-you' | 'following')}
      >
        <TabsList
          className="bg-muted/60 sticky top-0 z-10 grid w-full grid-cols-2 backdrop-blur"
          variant="line"
        >
          <RefreshTabTrigger
            value="for-you"
            label="推荐"
            isActive={activeTab === 'for-you'}
            onRefresh={() => void timelineQuery.refetch()}
            isRefreshing={activeTab === 'for-you' && isRefreshing}
          />
          <RefreshTabTrigger
            value="following"
            label="我关注的"
            isActive={activeTab === 'following'}
            onRefresh={() => void timelineQuery.refetch()}
            isRefreshing={activeTab === 'following' && isRefreshing}
          />
        </TabsList>

        <TabsContent value={activeTab} className="flex flex-col gap-3">
          <div ref={scrollRef} />
          {isLoading ? <PageLoadingState label="正在加载微博时间线..." /> : null}
          {!isLoading && errorMessage ? (
            <PageErrorState
              description={errorMessage}
              onRetry={() => void timelineQuery.refetch()}
            />
          ) : null}
          {!isLoading && !errorMessage ? (
            <FeedList
              items={items}
              emptyLabel="此时间线暂无内容"
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
    </div>
  )
}
