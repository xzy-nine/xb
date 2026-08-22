import { useElementSize } from '@reactuses/core'
import { useEffect, useMemo, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAppSettings } from '@/lib/app-settings-store'
import { PageEmptyState, PageErrorState, PageLoadingState } from '@/lib/weibo/components/page-state'
import { StatusCard } from '@/lib/weibo/components/status-card'
import { flattenInfiniteItems } from '@/lib/weibo/data/weibo-data'
import type { FeedItem } from '@/lib/weibo/models/feed'
import { useFeedRatingBatchSync } from '@/lib/weibo/rating/xb-rating'

const MIN_CARD_WIDTH = 300

interface InfiniteFeedListProps {
  pages: Array<{ items: FeedItem[] }> | undefined
  emptyLabel: string
  loadingLabel: string
  errorMessage: string | null
  loadMoreErrorMessage?: string | null
  isLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void | Promise<unknown>
  onRetry?: () => void
  className?: string
}

function FeedCards({
  items,
  emptyLabel,
  onRetry,
}: {
  items: FeedItem[]
  emptyLabel: string
  onRetry?: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth] = useElementSize(containerRef)
  const waterfallColumnCount = useAppSettings((s) => s.waterfallColumnCount)
  const immersiveMode = useAppSettings((s) => s.immersiveMode)
  const sidebarCollapsed = useAppSettings((s) => s.sidebarCollapsed)
  const waterfallExpandOnWideLayout = useAppSettings((s) => s.waterfallExpandOnWideLayout)

  if (items.length === 0) {
    return <PageEmptyState label={emptyLabel} onRetry={onRetry} />
  }

  const isExpanded = waterfallExpandOnWideLayout && (immersiveMode || sidebarCollapsed)

  const effectiveColumnCount =
    waterfallColumnCount > 1 && containerWidth > 0
      ? isExpanded
        ? waterfallColumnCount
        : Math.min(waterfallColumnCount, Math.max(1, Math.floor(containerWidth / MIN_CARD_WIDTH)))
      : 1

  if (effectiveColumnCount <= 1) {
    return (
      <div ref={containerRef}>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} data-feed-id={item.id}>
              <StatusCard status={item} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const gap = 16
  const cardWidth = (containerWidth - gap * (effectiveColumnCount - 1)) / effectiveColumnCount

  return (
    <div ref={containerRef}>
      <div className="flex flex-wrap items-stretch gap-4">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col" style={{ width: cardWidth }}>
            <StatusCard status={item} uniformHeight />
          </div>
        ))}
      </div>
    </div>
  )
}

export function InfiniteFeedList({
  pages,
  emptyLabel,
  loadingLabel,
  errorMessage,
  loadMoreErrorMessage = null,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onRetry,
  className = 'flex flex-col gap-3',
}: InfiniteFeedListProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const fetchNextPageRef = useRef(fetchNextPage)
  const isFetchingNextPageRef = useRef(isFetchingNextPage)
  fetchNextPageRef.current = fetchNextPage
  isFetchingNextPageRef.current = isFetchingNextPage

  const items = useMemo(() => flattenInfiniteItems<FeedItem>(pages), [pages])
  const hasItems = items.length > 0
  const showInitialError = Boolean(errorMessage) && !hasItems
  const showFeed = !showInitialError

  useFeedRatingBatchSync(pages)

  useEffect(() => {
    const el = loadMoreRef.current
    if (!el || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPageRef.current) {
          void fetchNextPageRef.current()
        }
      },
      { threshold: 0.2 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage])

  const handleLoadMoreRetry = () => {
    void fetchNextPage()
  }

  const isBusy = isLoading || isFetchingNextPage
  const loadingAnnouncement = isLoading
    ? loadingLabel
    : isFetchingNextPage
      ? '正在加载更多微博…'
      : ''

  return (
    <>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {loadingAnnouncement}
      </span>
      <div className={className} aria-busy={isBusy || undefined}>
        {isLoading ? <PageLoadingState label={loadingLabel} isAnnouncedSeparately /> : null}
        {!isLoading && showInitialError ? (
          <PageErrorState description={errorMessage!} onRetry={onRetry} />
        ) : null}
        {!isLoading && showFeed ? (
          <FeedCards items={items} emptyLabel={emptyLabel} onRetry={onRetry} />
        ) : null}
        {!isLoading && loadMoreErrorMessage ? (
          <div className="flex flex-col items-center gap-2 py-3">
            <p className="text-destructive text-sm">{loadMoreErrorMessage}</p>
            <Button size="sm" variant="outline" onClick={handleLoadMoreRetry}>
              加载失败，点击重试
            </Button>
          </div>
        ) : null}
        {hasNextPage ? (
          <div ref={loadMoreRef} className="flex justify-center py-3">
            {isFetchingNextPage ? <Spinner size="sm" aria-hidden="true" /> : null}
          </div>
        ) : null}
      </div>
    </>
  )
}
