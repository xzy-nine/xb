import { useInfiniteQuery } from '@tanstack/react-query'

import { useAppSettings } from '@/lib/app-settings-store'
import { useAppShellContext } from '@/lib/weibo/app/app-shell-layout'
import { InfiniteFeedList } from '@/lib/weibo/components/infinite-feed-list'
import { TimelineTopBar } from '@/lib/weibo/components/timeline-top-bar'
import { composeTargetFromFeedItem } from '@/lib/weibo/models/compose'
import type { TimelinePage } from '@/lib/weibo/models/feed'
import { favoritesInfiniteOptions } from '@/lib/weibo/queries/weibo-queries'
import { useWeiboPage } from '@/lib/weibo/route/use-weibo-page'

export function FavoritesPage() {
  const ctx = useAppShellContext()
  const page = useWeiboPage()
  const rewriteEnabled = useAppSettings((s) => s.rewriteEnabled)

  const uid = page.kind === 'favorites' ? page.uid : ''
  const isEnabled = rewriteEnabled && page.kind === 'favorites'

  const favoritesQuery = useInfiniteQuery({
    ...favoritesInfiniteOptions(uid),
    enabled: isEnabled && uid !== '',
  })

  const errorMessage = favoritesQuery.error instanceof Error ? favoritesQuery.error.message : null
  const hasNextPage = Boolean(favoritesQuery.hasNextPage)
  const isFetchingNextPage = favoritesQuery.isFetchingNextPage
  const isLoading = favoritesQuery.isLoading
  const isRefreshing = favoritesQuery.isFetching && !isFetchingNextPage && !isLoading
  const handleFavoriteTypeChange = () => {
    // 预留收藏类型扩展入口，目前微博接口只接入全部收藏。
  }

  return (
    <div className="flex flex-col">
      <TimelineTopBar
        title="收藏"
        filterLabel="全部收藏"
        filterOptions={[{ value: 'all', label: '全部收藏' }]}
        filterValue="all"
        onFilterChange={handleFavoriteTypeChange}
        onRefresh={() => void favoritesQuery.refetch()}
        isRefreshing={isRefreshing}
      />

      <InfiniteFeedList
        pages={favoritesQuery.data?.pages as TimelinePage[] | undefined}
        emptyLabel="暂无收藏内容"
        loadingLabel="正在加载收藏..."
        errorMessage={errorMessage}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={favoritesQuery.fetchNextPage}
        onRetry={() => void favoritesQuery.refetch()}
        onNavigate={ctx.navigateToStatusDetail}
        onCommentClick={(item) => ctx.setComposeTarget(composeTargetFromFeedItem(item, 'comment'))}
        onRepostClick={(item) => ctx.setComposeTarget(composeTargetFromFeedItem(item, 'repost'))}
      />
    </div>
  )
}
