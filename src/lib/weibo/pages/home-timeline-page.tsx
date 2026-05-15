import { usePrevious } from '@reactuses/core'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppSettings } from '@/lib/app-settings-store'
import { cn } from '@/lib/utils'
import { useAppShellContext } from '@/lib/weibo/app/app-shell-layout'
import { FeedList } from '@/lib/weibo/components/feed-list'
import { NewPostsBubble } from '@/lib/weibo/components/new-posts-bubble'
import { PageErrorState, PageLoadingState } from '@/lib/weibo/components/page-state'
import { composeTargetFromFeedItem } from '@/lib/weibo/models/compose'
import type { FeedItem, TimelinePage } from '@/lib/weibo/models/feed'
import {
  flattenInfiniteItems,
  followingNewPostsCheckOptions,
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
  const queryClient = useQueryClient()
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

  // ─── Scroll to top after refresh completes ───
  const prevIsRefreshing = usePrevious(isRefreshing)

  useEffect(() => {
    if (prevIsRefreshing && !isRefreshing) {
      ctx.scrollMainToTop()
    }
  }, [prevIsRefreshing, isRefreshing, ctx])

  // ─── IntersectionObserver for infinite scroll ───
  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void timelineQuery.fetchNextPage()
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, timelineQuery])

  // ─── New posts check (following tab only) ───
  const followingFirstItemId = items.length > 0 && activeTab === 'following' ? items[0].id : null

  const newPostsCheckQuery = useQuery({
    ...followingNewPostsCheckOptions(followingFirstItemId),
    enabled: isEnabled && activeTab === 'following' && followingFirstItemId !== null,
  })

  const [hasNewPosts, setHasNewPosts] = useState(false)

  useEffect(() => {
    if (!newPostsCheckQuery.data || hasNewPosts || newPostsCheckQuery.isFetching) return
    setHasNewPosts(true)
  }, [hasNewPosts, newPostsCheckQuery.data, newPostsCheckQuery.isFetching])

  const handleNewPostsClick = useCallback(() => {
    setHasNewPosts(false)
    queryClient.setQueryData(['weibo', 'timeline', 'following', 'new-check'], null)
    void queryClient.invalidateQueries({
      queryKey: ['weibo', 'timeline', 'following'],
      exact: true,
    })
  }, [queryClient])

  return (
    <div className="relative">
      <Tabs
        value={activeTab}
        className="flex flex-col"
        onValueChange={(value) => ctx.onHomeTabChange(value as 'for-you' | 'following')}
      >
        <TabsList
          className="bg-background/80 border-border/40 sticky top-0 z-10 grid w-full grid-cols-2 border-b backdrop-blur-lg"
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
          {hasNewPosts ? (
            <div className="absolute top-20 left-1/2 z-20 -translate-x-1/2">
              <NewPostsBubble
                authors={newPostsCheckQuery.data?.authors ?? []}
                count={newPostsCheckQuery.data?.count ?? 0}
                onClick={handleNewPostsClick}
              />
            </div>
          ) : null}
        </TabsList>

        <TabsContent value={activeTab} className="flex flex-col">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
