import { useCallback, useRef, type KeyboardEvent, type MouseEvent } from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { type FeedInteractionMode } from '@/lib/app-settings'
import { cn } from '@/lib/utils'
import { ImageCarousel } from '@/lib/weibo/components/image-carousel'
import { browsingHistoryStore } from '@/lib/weibo/hooks/use-browsing-history'
import { useFeedLongText } from '@/lib/weibo/hooks/use-feed-long-text'
import type { FeedItem } from '@/lib/weibo/models/feed'

import { type ProfileLookup, RetweetedAuthorHeader } from './feed-card-author'
import { FeedMediaBlock } from './feed-card-media'
import { FeedTextBlock } from './feed-card-text'
import {
  getMediaDownloadFilename,
  getStatusDetailPath,
  hasTextSelectionWithin,
  openStatusDetailInNewTab,
} from './feed-card-utils'

/**
 * Nested retweet preview: content only (no nested FeedActions).
 * Interaction stays on the outer card or status detail — Silent Canvas density.
 */
export function RetweetedFeedBlock({
  item,
  onNavigate,
  onNavigateProfile,
  onNavigateTopic,
  feedInteractionMode,
  // oxlint-disable-next-line no-unused-vars -- reserved for future action rendering
  onCommentClick,
  // oxlint-disable-next-line no-unused-vars -- reserved for future action rendering
  onRepostClick,
  // oxlint-disable-next-line no-unused-vars -- reserved for future action rendering
  onLikeClick,
  // oxlint-disable-next-line no-unused-vars -- reserved for future action rendering
  likePendingForId,
}: {
  item: NonNullable<FeedItem['retweetedStatus']>
  onNavigate?: (item: FeedItem) => void
  onNavigateProfile?: (lookup: ProfileLookup) => void
  onNavigateTopic?: (topic: string) => void
  onCommentClick?: (item: FeedItem) => void
  onRepostClick?: (item: FeedItem) => void
  onLikeClick?: (item: FeedItem) => void
  likePendingForId: string | null
  feedInteractionMode: FeedInteractionMode
}) {
  const {
    resolvedItem,
    shouldShowLoadLongText,
    isLongTextLoading,
    hasLongTextError,
    onLoadLongText,
  } = useFeedLongText(item)

  const addEntry = useCallback(() => {
    browsingHistoryStore.getState().addEntry(resolvedItem)
  }, [resolvedItem])

  const detailPath = getStatusDetailPath(resolvedItem)
  const canNavigate = feedInteractionMode === 'x' && onNavigate !== undefined && detailPath !== null
  const pointerDownPositionRef = useRef<{ x: number; y: number } | null>(null)
  const suppressNextClickRef = useRef(false)
  const navigationProps = canNavigate
    ? ({
        role: 'link',
        tabIndex: 0,
        'aria-label': `查看 ${resolvedItem.author.name || '微博'} 的微博详情`,
      } as const)
    : {}

  const handleRetweetedMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      pointerDownPositionRef.current = null
      return
    }

    suppressNextClickRef.current = false
    pointerDownPositionRef.current = { x: event.clientX, y: event.clientY }
  }

  const handleRetweetedMouseUp = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !pointerDownPositionRef.current) {
      return
    }

    const deltaX = event.clientX - pointerDownPositionRef.current.x
    const deltaY = event.clientY - pointerDownPositionRef.current.y
    suppressNextClickRef.current = Math.hypot(deltaX, deltaY) > 4
    pointerDownPositionRef.current = null
  }

  const handleRetweetedClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (!canNavigate) {
      return
    }

    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }

    const target = event.target as HTMLElement
    const interactiveSelectors = 'a,button,[role="button"],input,textarea,select,label'
    const closestInteractive = target.closest(interactiveSelectors)

    // Check if the closest interactive element is inside this retweeted block (not the outer card's <a>)
    const isOnInteractiveChild = closestInteractive
      ? event.currentTarget.contains(closestInteractive) &&
        closestInteractive !== event.currentTarget
      : false

    // Normalize button value: 0 (left), 1 (middle), 2 (right)
    const button = event.button ?? 0

    if (
      button === 0 &&
      (event.metaKey || event.ctrlKey) &&
      !isOnInteractiveChild &&
      !hasTextSelectionWithin(event.currentTarget) &&
      detailPath !== null
    ) {
      openStatusDetailInNewTab(detailPath)
      return
    }

    if (button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }

    if (isOnInteractiveChild) {
      return
    }

    if (hasTextSelectionWithin(event.currentTarget)) {
      return
    }

    onNavigate?.(resolvedItem)
  }

  const handleRetweetedAuxClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (!canNavigate || event.button !== 1 || detailPath === null) {
      return
    }

    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }

    const target = event.target as HTMLElement
    const interactiveSelectors = 'a,button,[role="button"],input,textarea,select,label'
    const closestInteractive = target.closest(interactiveSelectors)

    // Check if the closest interactive element is inside this retweeted block
    if (
      closestInteractive &&
      event.currentTarget.contains(closestInteractive) &&
      closestInteractive !== event.currentTarget
    ) {
      return
    }

    if (hasTextSelectionWithin(event.currentTarget)) {
      return
    }

    openStatusDetailInNewTab(detailPath)
  }

  const handleRetweetedKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!canNavigate) return
    if (event.target !== event.currentTarget) return
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    onNavigate?.(resolvedItem)
  }

  return (
    <Card
      className={cn(
        'xb-feed-card xb-feed-card--compact gap-3 py-4',
        canNavigate &&
          'cursor-pointer focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none',
      )}
      data-testid="feed-card-body"
      onMouseDown={handleRetweetedMouseDown}
      onMouseUp={handleRetweetedMouseUp}
      onClick={handleRetweetedClick}
      onAuxClick={handleRetweetedAuxClick}
      onKeyDown={handleRetweetedKeyDown}
      {...navigationProps}
    >
      <CardHeader>
        <RetweetedAuthorHeader item={resolvedItem} onNavigateProfile={onNavigateProfile} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-4">
        <FeedTextBlock
          item={resolvedItem}
          canLoadLongText={shouldShowLoadLongText}
          isLongTextLoading={isLongTextLoading}
          hasLongTextError={hasLongTextError}
          onLoadLongText={onLoadLongText}
          onNavigateTopic={onNavigateTopic}
        />

        <FeedMediaBlock item={resolvedItem} />

        <ImageCarousel
          images={resolvedItem.images}
          mixMediaItems={resolvedItem.mixMediaInfo}
          downloadFilename={getMediaDownloadFilename(resolvedItem)}
          onOpen={addEntry}
        />
      </CardContent>
    </Card>
  )
}
