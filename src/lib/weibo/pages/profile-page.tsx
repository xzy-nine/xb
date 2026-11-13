import { skipToken, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { type SetURLSearchParams, type URLSearchParamsInit, useSearchParams } from 'react-router'

import { useAppSettings } from '@/lib/app-settings-store'
import { useAppShellContext } from '@/lib/weibo/app/app-shell-layout'
import { usePageRuntime } from '@/lib/weibo/app/page-runtime'
import { InfiniteFeedList } from '@/lib/weibo/components/infinite-feed-list'
import { PageErrorState, PageLoadingState } from '@/lib/weibo/components/page-state'
import { ProfileHeader } from '@/lib/weibo/components/profile-header'
import { ProfileSearchBar } from '@/lib/weibo/components/profile-search-bar'
import { TimelineTopBar } from '@/lib/weibo/components/timeline-top-bar'
import {
  loadProfileHoverCard,
  profileLookupFromPage,
  profilePostsInfiniteOptions,
  profileSearchInfiniteOptions,
} from '@/lib/weibo/data/weibo-data'
import type { TimelinePage } from '@/lib/weibo/models/feed'
import {
  parseProfileSearchUrlState,
  type ProfileSearchUrlState,
  profileSearchStateKey,
  writeProfileSearchParams,
} from '@/lib/weibo/route/profile-search-params'
import { useColumnPageRefresh } from '@/lib/weibo/workspace/column-page-toolbar'

export function ProfilePostsTabs({
  profileId,
  searchState,
  searchBarKey,
  searchParams,
  setSearchParams,
}: {
  profileId: string
  searchState?: ReturnType<typeof parseProfileSearchUrlState>
  searchBarKey?: string
  searchParams?: URLSearchParams
  setSearchParams?: SetURLSearchParams
}) {
  const runtimeScrollRootRef = usePageRuntime().scrollRootRef
  const isSearchEnabled =
    searchState !== undefined && searchParams !== undefined && setSearchParams !== undefined

  const postsQuery = useInfiniteQuery({
    ...profilePostsInfiniteOptions(profileId),
    enabled: profileId !== '' && !searchState?.active,
  })
  const searchQuery = useInfiniteQuery({
    ...profileSearchInfiniteOptions(profileId, searchState!.params),
    enabled: profileId !== '' && isSearchEnabled && searchState?.active,
  })

  const activeQuery = isSearchEnabled && searchState?.active ? searchQuery : postsQuery
  const errorMessage =
    activeQuery.error instanceof Error && !activeQuery.isFetchNextPageError
      ? activeQuery.error.message
      : null
  const loadMoreErrorMessage =
    activeQuery.error instanceof Error && activeQuery.isFetchNextPageError
      ? activeQuery.error.message
      : null
  const hasNextPage = Boolean(activeQuery.hasNextPage)
  const isFetchingNextPage = activeQuery.isFetchingNextPage
  const total = searchQuery.data?.pages[0]?.total

  return (
    <div className="flex flex-col gap-4">
      {isSearchEnabled && searchBarKey && searchState && searchParams && setSearchParams ? (
        <ProfileSearchBar
          key={searchBarKey}
          state={searchState}
          resultTotal={total}
          isSearching={searchQuery.isFetching}
          onSubmit={(params) => {
            setSearchParams(writeProfileSearchParams(searchParams, { active: true, params }))
          }}
          onClear={() => {
            setSearchParams(
              writeProfileSearchParams(searchParams, { active: false, params: searchState.params }),
            )
          }}
        />
      ) : null}
      <InfiniteFeedList
        scrollRootRef={runtimeScrollRootRef}
        pages={activeQuery.data?.pages as TimelinePage[] | undefined}
        emptyLabel={
          isSearchEnabled && searchState?.active ? '没有找到相关微博' : '暂时还没有微博内容'
        }
        loadingLabel={
          isSearchEnabled && searchState?.active ? '正在搜索此用户微博…' : '正在加载此用户微博…'
        }
        errorMessage={errorMessage}
        loadMoreErrorMessage={loadMoreErrorMessage}
        isLoading={activeQuery.isLoading}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={activeQuery.fetchNextPage}
        onRetry={() => void activeQuery.refetch()}
      />
    </div>
  )
}

function ProfileContent({
  page,
  searchParams,
  setSearchParams,
  onProfileUserIdChange,
}: {
  page: Extract<ReturnType<typeof usePageRuntime>['page'], { kind: 'profile' }>
  searchParams: URLSearchParams
  setSearchParams: SetURLSearchParams
  onProfileUserIdChange?: (userId: string | null) => void
}) {
  const rewriteEnabled = useAppSettings((s) => s.rewriteEnabled)
  const queryClient = useQueryClient()

  const profileLookup = profileLookupFromPage(page)
  const isEnabled = rewriteEnabled
  const searchState = useMemo(() => parseProfileSearchUrlState(searchParams), [searchParams])
  const searchBarKey = profileSearchStateKey(searchState)

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
    onProfileUserIdChange?.(profileQuery.data?.id ?? null)
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [onProfileUserIdChange, profileQuery.data?.id])

  const errorMessage = profileQuery.error instanceof Error ? profileQuery.error.message : null
  const resolvedProfileId =
    profileQuery.data?.id ?? (page.profileSource === 'u' ? page.profileId : '')
  const [isRefreshingLists, setIsRefreshingLists] = useState(false)
  const refetchProfile = profileQuery.refetch
  const refreshProfile = useCallback(() => {
    void refetchProfile()
    if (!resolvedProfileId) return
    setIsRefreshingLists(true)
    void Promise.all([
      queryClient.refetchQueries({
        queryKey: ['weibo', 'profile', 'posts', resolvedProfileId],
      }),
      queryClient.refetchQueries({
        queryKey: ['weibo', 'profile', 'search', resolvedProfileId],
      }),
    ]).finally(() => {
      setIsRefreshingLists(false)
    })
  }, [queryClient, refetchProfile, resolvedProfileId])
  useColumnPageRefresh(
    refreshProfile,
    (profileQuery.isFetching && !profileQuery.isLoading) || isRefreshingLists,
  )

  return (
    <div className="pt-4">
      {profileQuery.isLoading ? <PageLoadingState label="正在加载此用户主页…" /> : null}
      {!profileQuery.isLoading && errorMessage ? (
        <PageErrorState description={errorMessage} />
      ) : null}
      {!profileQuery.isLoading && !errorMessage && profileQuery.data ? (
        <div className="flex flex-col gap-4">
          <ProfileHeader profile={profileQuery.data} />
          <ProfilePostsTabs
            profileId={profileQuery.data.id}
            searchState={searchState}
            searchBarKey={searchBarKey}
            searchParams={searchParams}
            setSearchParams={setSearchParams}
          />
        </div>
      ) : null}
    </div>
  )
}

export function ProfilePage() {
  const page = usePageRuntime().page
  const { onProfileUserIdChange } = useAppShellContext()
  const [searchParams, setSearchParams] = useSearchParams()
  if (page.kind !== 'profile') return null

  return (
    <ProfileContent
      page={page}
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      onProfileUserIdChange={onProfileUserIdChange}
    />
  )
}

/** 把 react-router 的 URLSearchParamsInit 收敛成 URLSearchParams。 */
function toSearchParamsInit(init: URLSearchParamsInit | undefined): URLSearchParams {
  const params = new URLSearchParams()
  if (init === undefined) return params
  if (init instanceof URLSearchParams) return new URLSearchParams(init)
  if (typeof init === 'string') return new URLSearchParams(init)
  const entries = Array.isArray(init) ? init : Object.entries(init)
  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item)
    } else if (value !== undefined) {
      params.append(key, value)
    }
  }
  return params
}

export function ProfileColumnPage({
  source,
}: {
  source: {
    profileId: string
    profileSource: 'u' | 'n'
    search?: ProfileSearchUrlState
  }
}) {
  const [searchParams, setSearchParams] = useState(() =>
    source.search
      ? writeProfileSearchParams(new URLSearchParams(), source.search)
      : new URLSearchParams(),
  )
  return (
    <>
      <TimelineTopBar title="个人主页" />
      <ProfileContent
        page={{ kind: 'profile', ...source, tab: 'posts' }}
        searchParams={searchParams}
        setSearchParams={(init) => {
          if (typeof init === 'function') {
            setSearchParams(toSearchParamsInit(init(searchParams)))
            return
          }
          setSearchParams(toSearchParamsInit(init))
        }}
      />
    </>
  )
}
