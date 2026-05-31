import { skipToken, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppSettings } from '@/lib/app-settings-store'
import { useAppShellContext } from '@/lib/weibo/app/app-shell-layout'
import { InfiniteFeedList } from '@/lib/weibo/components/infinite-feed-list'
import { PageEmptyState, PageErrorState, PageLoadingState } from '@/lib/weibo/components/page-state'
import { ProfileHeader } from '@/lib/weibo/components/profile-header'
import { composeTargetFromFeedItem } from '@/lib/weibo/models/compose'
import type { TimelinePage } from '@/lib/weibo/models/feed'
import {
  profileLookupFromPage,
  profilePostsInfiniteOptions,
} from '@/lib/weibo/queries/weibo-queries'
import { useWeiboPage } from '@/lib/weibo/route/use-weibo-page'
import { loadProfileHoverCard } from '@/lib/weibo/services/weibo-repository'

export function ProfilePostsTabs({
  profileId,
  onNavigate,
  onCommentClick,
  onRepostClick,
  onCommentReply,
}: {
  profileId: string
  onNavigate: ReturnType<typeof useAppShellContext>['navigateToStatusDetail']
  onCommentClick: (item: Parameters<typeof composeTargetFromFeedItem>[0]) => void
  onRepostClick: (item: Parameters<typeof composeTargetFromFeedItem>[0]) => void
  onCommentReply: ReturnType<typeof useAppShellContext>['setComposeTarget']
}) {
  const postsQuery = useInfiniteQuery({
    ...profilePostsInfiniteOptions(profileId),
    enabled: profileId !== '',
  })

  const errorMessage = postsQuery.error instanceof Error ? postsQuery.error.message : null
  const hasNextPage = Boolean(postsQuery.hasNextPage)
  const isFetchingNextPage = postsQuery.isFetchingNextPage

  return (
    <Tabs defaultValue="posts" className="flex flex-col gap-4">
      <TabsList className="sticky top-0 z-10 grid w-full grid-cols-2 overflow-hidden">
        <TabsTrigger value="posts">微博</TabsTrigger>
        <TabsTrigger value="pictures">图片</TabsTrigger>
      </TabsList>

      <TabsContent value="posts" className="flex flex-col gap-4">
        <InfiniteFeedList
          pages={postsQuery.data?.pages as TimelinePage[] | undefined}
          emptyLabel="暂时还没有微博内容"
          loadingLabel="正在加载此用户微博..."
          errorMessage={errorMessage}
          isLoading={postsQuery.isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={postsQuery.fetchNextPage}
          onRetry={() => void postsQuery.refetch()}
          onNavigate={onNavigate}
          onCommentClick={onCommentClick}
          onRepostClick={onRepostClick}
          onCommentReply={onCommentReply}
          className="flex flex-col gap-4"
        />
      </TabsContent>

      <TabsContent value="pictures" className="flex flex-col gap-0">
        <PageEmptyState label="施工中..." />
      </TabsContent>
    </Tabs>
  )
}

export function ProfilePage() {
  const ctx = useAppShellContext()
  const page = useWeiboPage()
  const rewriteEnabled = useAppSettings((s) => s.rewriteEnabled)

  const profileLookup = profileLookupFromPage(page)
  const isEnabled = rewriteEnabled && page.kind === 'profile'

  const profileQuery = useQuery({
    queryKey: [
      'weibo',
      'profile',
      'info',
      profileLookup ? ('uid' in profileLookup ? 'u' : 'n') : null,
      profileLookup
        ? 'uid' in profileLookup
          ? profileLookup.uid
          : profileLookup.screenName
        : null,
    ],
    queryFn: profileLookup ? () => loadProfileHoverCard(profileLookup) : skipToken,
    enabled: isEnabled && profileLookup !== null,
  })

  useEffect(() => {
    ctx.onProfileUserIdChange(profileQuery.data?.id ?? null)
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [ctx.onProfileUserIdChange, profileQuery.data?.id])

  const errorMessage = profileQuery.error instanceof Error ? profileQuery.error.message : null

  return (
    <div className="pt-4">
      {profileQuery.isLoading ? <PageLoadingState label="正在加载此用户主页..." /> : null}
      {!profileQuery.isLoading && errorMessage ? (
        <PageErrorState description={errorMessage} />
      ) : null}
      {!profileQuery.isLoading && !errorMessage && profileQuery.data ? (
        <div className="flex flex-col gap-4">
          <ProfileHeader profile={profileQuery.data} />
          <ProfilePostsTabs
            profileId={profileQuery.data.id}
            onNavigate={ctx.navigateToStatusDetail}
            onCommentClick={(item) =>
              ctx.setComposeTarget(composeTargetFromFeedItem(item, 'comment'))
            }
            onRepostClick={(item) =>
              ctx.setComposeTarget(composeTargetFromFeedItem(item, 'repost'))
            }
            onCommentReply={ctx.setComposeTarget}
          />
        </div>
      ) : null}
    </div>
  )
}
