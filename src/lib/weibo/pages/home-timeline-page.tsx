import { usePrevious } from '@reactuses/core'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { Bug, RefreshCw } from 'lucide-react'
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
  followGroupsQueryOptions,
} from '@/lib/weibo/queries/weibo-queries'
import { useWeiboPage } from '@/lib/weibo/route/use-weibo-page'
import type { FollowGroup } from '@/lib/weibo/services/adapters/explore-groups'

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
  const followGroupsEnabled = useAppSettings((s) => s.followGroupsEnabled)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

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
    ...followingNewPostsCheckOptions(followingFirstItemId, groupListId),
    enabled: isEnabled && activeTab === 'following' && followingFirstItemId !== null,
    refetchOnWindowFocus: true,
  })

  const [hasNewPosts, setHasNewPosts] = useState(false)

  useEffect(() => {
    if (!newPostsCheckQuery.data || hasNewPosts || newPostsCheckQuery.isFetching) return
    setHasNewPosts(true)
  }, [hasNewPosts, newPostsCheckQuery.data, newPostsCheckQuery.isFetching])

  const handleNewPostsClick = useCallback(() => {
    setHasNewPosts(false)
    queryClient.setQueryData(
      ['weibo', 'timeline', 'following', groupListId ?? 'default', 'new-check'],
      null,
    )
    void queryClient.invalidateQueries({
      queryKey: ['weibo', 'timeline', 'following', groupListId ?? 'default'],
      exact: true,
    })
  }, [queryClient, groupListId])

  const handleGroupSelect = useCallback(
    (gid: string) => {
      ctx.onFollowGroupChange(gid === 'default' ? null : gid)
    },
    [ctx],
  )

  const groups = groupsQuery.data ?? []

  return (
    <div className="relative">
      {/* DEBUG: 本地调试气泡，调试完删除 */}
      {import.meta.env.DEV && (
        <button
          type="button"
          onClick={() => {
            setHasNewPosts(true)
            queryClient.setQueryData(['weibo', 'timeline', 'following', 'new-check'], {
              authors: [
                { id: 'd1', name: '测试用户A', avatarUrl: null },
                { id: 'd2', name: '测试用户B', avatarUrl: null },
                { id: 'd3', name: '测试用户C', avatarUrl: null },
                { id: 'd4', name: '测试用户D', avatarUrl: null },
                { id: 'd5', name: '测试用户E', avatarUrl: null },
              ],
              count: 5,
            })
          }}
          className="fixed right-4 bottom-4 z-50 flex items-center gap-1.5 rounded-full bg-yellow-500 px-3 py-1.5 text-xs font-medium text-white shadow-lg hover:bg-yellow-600"
        >
          <Bug className="size-3.5" />
          触发气泡
        </button>
      )}
      <Tabs
        value={activeTab}
        className="flex flex-col"
        onValueChange={(value) => ctx.onHomeTabChange(value as 'for-you' | 'following')}
      >
        <TabsList
          className="bg-background/80 border-border/40 relative sticky top-0 z-10 grid w-full grid-cols-2 border-b backdrop-blur-lg"
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
          {showGroupSelect && groups.length > 0 && (
            <FollowGroupPillBar
              groups={groups}
              selectedGid={selectedGroupGid}
              onSelect={handleGroupSelect}
            />
          )}
        </TabsList>

        <TabsContent
          value={activeTab}
          className={cn('flex flex-col', showGroupSelect && groups.length > 0 && 'pt-12')}
        >
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

function FollowGroupPillBar({
  groups,
  selectedGid,
  onSelect,
}: {
  groups: FollowGroup[]
  selectedGid: string
  onSelect: (gid: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  return (
    <div
      ref={scrollRef}
      className="bg-background/80 border-border/40 absolute top-full z-10 flex w-full scrollbar-none gap-1.5 overflow-x-auto border-b px-1 py-2 backdrop-blur-lg"
    >
      <FollowGroupPill
        label="全部"
        isActive={selectedGid === 'default'}
        onClick={() => onSelect('default')}
        className="sticky left-0"
      />
      {groups.map((group) => (
        <FollowGroupPill
          key={group.gid}
          label={group.title}
          isActive={selectedGid === group.gid}
          onClick={() => onSelect(group.gid)}
        />
      ))}
    </div>
  )
}

function FollowGroupPill({
  label,
  isActive,
  onClick,
  className,
}: {
  label: string
  isActive: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
        className,
        isActive
          ? 'bg-foreground text-background'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
