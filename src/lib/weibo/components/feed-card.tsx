import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bookmark,
  Copy,
  Download,
  Heart,
  Image,
  LinkIcon,
  MessageCircle,
  Repeat2,
} from 'lucide-react'
import {
  memo,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  type FeedInteractionMode,
  type FeedPrimaryActionId,
  type FeedToolbarButtonId,
  FEED_TOOLBAR_BUTTON_IDS,
} from '@/lib/app-settings'
import { useAppSettings, useShallow } from '@/lib/app-settings-store'
import { cn } from '@/lib/utils'
import { FeedCardMoreMenu } from '@/lib/weibo/components/feed-card-more-menu'
import { FeedCommentsExpanded } from '@/lib/weibo/components/feed-comments-expanded'
import { useGenImageDialog } from '@/lib/weibo/components/gen-image-dialog-context'
import { ImageCarousel } from '@/lib/weibo/components/image-carousel'
import { RatingSummaryBadge } from '@/lib/weibo/components/rating-panel'
import { StatusText } from '@/lib/weibo/components/status-text'
import { useFeedCardMediaDownload } from '@/lib/weibo/components/use-feed-card-media-download'
import { UserHoverCard } from '@/lib/weibo/components/user-hover-card'
import { CreatedAtBadge, UserAvatar } from '@/lib/weibo/components/user-presenter'
import { browsingHistoryStore } from '@/lib/weibo/hooks/use-browsing-history'
import { useFeedLongText } from '@/lib/weibo/hooks/use-feed-long-text'
import { useFontSettings } from '@/lib/weibo/hooks/use-font-settings'
import type { FeedItem } from '@/lib/weibo/models/feed'
import {
  type StatusFeedSurface,
  statusAllowsCardNavigate,
} from '@/lib/weibo/models/status-presentation'
import { getCurrentUserUid } from '@/lib/weibo/platform/current-user'
import {
  optimisticallyRemoveStatusFromFavorites,
  optimisticallyToggleStatusFavorite,
  optimisticallyToggleStatusLike,
  restoreStatusCacheMutation,
} from '@/lib/weibo/queries/status-cache'
import {
  cancelStatusLike,
  createFavorite,
  deleteWeiboStatus,
  destroyFavorite,
  setStatusLike,
} from '@/lib/weibo/services/weibo-repository'
import { sanitizeFilename } from '@/lib/weibo/utils/filename'
import { formatWeiboCount } from '@/lib/weibo/utils/format-weibo-count'

import { AudioPlayerComponent } from './media-player/audio-player'
import { LivePlayer } from './media-player/live-player'
import { VideoPlayer } from './media-player/video-player'

function hasTextSelectionWithin(container: HTMLElement) {
  const selection = window.getSelection()
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return false
  }

  const range = selection.getRangeAt(0)
  const commonAncestor = range.commonAncestorContainer
  return commonAncestor === container || container.contains(commonAncestor)
}

function openStatusDetailInNewTab(path: string): void {
  // Use the full URL so the new tab loads at the correct weibo.com path
  // regardless of the current location. The xb content script runs on
  // https://weibo.com/* and react-router picks up the new path on load.
  window.open(`${window.location.origin}${path}`, '_blank', 'noopener,noreferrer')
}

function getMediaDownloadFilename(item: Pick<FeedItem, 'author' | 'text'>) {
  return `${item.author.name} ${sanitizeFilename(item.text.slice(0, 15))}`
}

function getStatusCopyText(item: Pick<FeedItem, 'text' | 'markdownText'>) {
  return item.markdownText || item.text
}

function getStatusDetailPath(item: Pick<FeedItem, 'author' | 'id' | 'mblogId'>) {
  const statusId = item.mblogId ?? item.id
  if (!item.author.id || !statusId) return null
  return `/${item.author.id}/${statusId}`
}

function FeedMediaBlock({ item }: { item: FeedItem }) {
  const addEntry = useCallback(() => {
    browsingHistoryStore.getState().addEntry(item)
  }, [item])

  if (!item.media) {
    return null
  }

  if (item.media.type === 'audio') {
    return (
      <div
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <AudioPlayerComponent src={item.media.streamUrl} />
      </div>
    )
  }

  if (item.media.type === 'live') {
    return (
      <div
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <AspectRatio ratio={16 / 9}>
          <LivePlayer
            streamUrl={item.media.streamUrl}
            coverUrl={item.media.coverUrl ?? ''}
            liveStatus={item.media.liveStatus ?? 0}
            replayUrl={item.media.replayUrl}
          />
        </AspectRatio>
      </div>
    )
  }

  return (
    <div
      onClick={(event) => {
        event.stopPropagation()
      }}
    >
      <AspectRatio ratio={item.media.videoOrientation === 'vertical' ? 4 / 3 : 16 / 9}>
        <VideoPlayer
          progressiveSrc={item.media.streamUrl}
          poster={item.media.coverUrl ?? undefined}
          dash={item.media.dash}
          downloadUrl={item.media.downloadUrl}
          downloadFilename={getMediaDownloadFilename(item)}
          onPlay={addEntry}
        />
      </AspectRatio>
    </div>
  )
}

type ProfileLookup = { uid: string } | { screenName: string }

function FeedAuthorHeader({
  item,
  onNavigateProfile,
  trailing,
}: {
  item: Pick<FeedItem, 'author' | 'createdAtLabel' | 'source' | 'regionName'>
  trailing?: ReactNode
  onNavigateProfile?: (lookup: ProfileLookup) => void
}) {
  return (
    <CardHeader className="flex flex-row gap-3 px-4">
      <UserHoverCard uid={item.author.id}>
        <Link
          to={`/n/${encodeURIComponent(item.author.name)}`}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            if (onNavigateProfile) {
              onNavigateProfile({ uid: item.author.id })
            }
          }}
        >
          <UserAvatar
            author={item.author}
            sizeClassName="size-12"
            fallbackClassName="text-sm font-semibold"
          />
        </Link>
      </UserHoverCard>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <UserHoverCard uid={item.author.id}>
                <Link
                  to={`/n/${encodeURIComponent(item.author.name)}`}
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    if (onNavigateProfile) {
                      onNavigateProfile({ uid: item.author.id })
                    }
                  }}
                >
                  <CardTitle className="truncate text-base hover:underline">
                    {item.author.name}
                  </CardTitle>
                </Link>
              </UserHoverCard>
              <CreatedAtBadge label={item.createdAtLabel} />
              {trailing ? (
                <div
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  {trailing}
                </div>
              ) : null}
            </div>
            <CardDescription className="text-xs">
              {item.source ? `${item.source}` : ''} {item.regionName ? `${item.regionName}` : ''}
            </CardDescription>
          </div>
        </div>
      </div>
    </CardHeader>
  )
}

function RetweetedAuthorHeader({
  item,
  onNavigateProfile,
}: {
  item: Pick<FeedItem, 'author' | 'createdAtLabel' | 'source' | 'regionName'>
  onNavigateProfile?: (lookup: ProfileLookup) => void
}) {
  const isDeletedAuthor = !item.author.id

  if (isDeletedAuthor) {
    return <div className="text-muted-foreground text-sm">未知用户</div>
  }

  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-2">
      <UserHoverCard uid={item.author.id}>
        <Link
          to={`/n/${encodeURIComponent(item.author.name)}`}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            if (onNavigateProfile) {
              onNavigateProfile({ uid: item.author.id })
            }
          }}
        >
          <UserAvatar
            author={item.author}
            sizeClassName="size-9"
            fallbackClassName="text-xs font-semibold"
          />
        </Link>
      </UserHoverCard>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <UserHoverCard uid={item.author.id}>
            <Link
              to={`/n/${encodeURIComponent(item.author.name)}`}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (onNavigateProfile) {
                  onNavigateProfile({ uid: item.author.id })
                }
              }}
            >
              <p className="text-foreground truncate text-sm font-medium hover:underline">
                {item.author.name}
              </p>
            </Link>
          </UserHoverCard>
          <CreatedAtBadge label={item.createdAtLabel} />
        </div>
        <p className="text-muted-foreground text-xs">
          {item.source ? `${item.source}` : ''} {item.regionName ? `${item.regionName}` : ''}
        </p>
      </div>
    </div>
  )
}

function FeedTextBlock({
  item,
  canLoadLongText,
  isLongTextLoading,
  hasLongTextError,
  onLoadLongText,
  onNavigateTopic,
}: {
  item: FeedItem
  canLoadLongText: boolean
  isLongTextLoading: boolean
  hasLongTextError: boolean
  onLoadLongText: () => void
  onNavigateTopic?: (topic: string) => void
}) {
  const { fontSizeClass, fontWeightClass, letterSpacingClass, lineHeightClass, fontFamilyClass } =
    useFontSettings()
  const [textMode, setTextMode] = useState<'markdown' | 'plain'>('markdown')
  const canRenderMarkdown = item.isMarkdown && item.markdownText
  const resolvedTextMode = canRenderMarkdown ? textMode : 'plain'

  return (
    <div
      className={cn(
        'text-foreground',
        fontSizeClass,
        fontWeightClass,
        letterSpacingClass,
        lineHeightClass,
        fontFamilyClass,
      )}
    >
      {canRenderMarkdown ? (
        <Tabs
          value={resolvedTextMode}
          onValueChange={(value) => setTextMode(value as 'markdown' | 'plain')}
          onClick={(event) => event.stopPropagation()}
        >
          <TabsList>
            <TabsTrigger
              value="markdown"
              className="text-xs"
              onClick={() => setTextMode('markdown')}
            >
              Markdown
            </TabsTrigger>
            <TabsTrigger value="plain" className="text-xs" onClick={() => setTextMode('plain')}>
              原文
            </TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}

      <StatusText
        item={item}
        text={item.text}
        mode={resolvedTextMode}
        onNavigateTopic={onNavigateTopic}
      />

      {canLoadLongText ? (
        <LongTextButton
          onClick={(event) => {
            event.stopPropagation()
            onLoadLongText()
          }}
          isLoading={isLongTextLoading}
          hasError={hasLongTextError}
        />
      ) : null}
    </div>
  )
}

function LongTextButton({
  onClick,
  isLoading,
  hasError,
}: {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  isLoading: boolean
  hasError: boolean
}) {
  const label = isLoading ? '加载全文' : hasError ? '重试全文' : '阅读全文'

  return (
    <Button
      type="button"
      variant={hasError ? 'destructive' : 'secondary'}
      className={cn(isLoading && 'cursor-wait')}
      onClick={onClick}
      disabled={isLoading}
      aria-busy={isLoading}
    >
      {label}
    </Button>
  )
}

function FeedActions({
  item,
  surface,
  onCommentClick,
  onCommentExpand,
  commentsExpanded,
  commentsPanelId,
  onRepostClick,
  onLikeClick,
  likePending,
  feedInteractionMode,
  primaryActionOrder,
  toolbarButtonIds,
  favorited,
  onFavorite,
  favoritePending,
  onCopyLink,
  onCopyText,
  onGenImage,
  onDownload,
  downloadPending,
}: {
  item: FeedItem
  surface?: StatusFeedSurface
  onCommentClick?: (item: FeedItem) => void
  onCommentExpand?: (item: FeedItem) => void
  commentsExpanded?: boolean
  commentsPanelId?: string
  onRepostClick?: (item: FeedItem) => void
  onLikeClick?: (item: FeedItem) => void
  likePending?: boolean
  feedInteractionMode: FeedInteractionMode
  primaryActionOrder: FeedPrimaryActionId[]
  toolbarButtonIds: FeedToolbarButtonId[]
  favorited?: boolean
  onFavorite?: () => void | Promise<void>
  favoritePending?: boolean
  onCopyLink?: () => void
  onCopyText?: () => void
  onGenImage?: () => void
  onDownload?: () => void
  downloadPending?: boolean
}) {
  const liked = item.liked === true
  const isBookmarked = favorited === true
  const isDetail = surface === 'detail'
  const controlsInlineComments =
    commentsPanelId !== undefined &&
    onCommentExpand !== undefined &&
    !isDetail &&
    feedInteractionMode === 'weibo'
  const canDownload =
    item.images.length > 0 || item.media !== null || (item.mixMediaInfo?.length ?? 0) > 0

  function renderPrimaryAction(id: FeedPrimaryActionId) {
    if (id === 'comment') {
      return (
        <Button
          key={id}
          type="button"
          variant="ghost"
          aria-controls={controlsInlineComments ? commentsPanelId : undefined}
          aria-expanded={controlsInlineComments ? commentsExpanded === true : undefined}
          aria-label={
            controlsInlineComments
              ? commentsExpanded
                ? '收起精选评论'
                : '展开精选评论'
              : '回复微博'
          }
          className="group rounded-full py-2 font-normal transition-transform hover:bg-sky-50 hover:text-sky-500 active:scale-[0.96]"
          onClick={(event) => {
            event.stopPropagation()
            if (!controlsInlineComments) {
              onCommentClick?.(item)
            } else {
              onCommentExpand?.(item)
            }
          }}
        >
          <MessageCircle className="size-3.5 transition-colors group-hover:text-sky-500" />
          <span className="tabular-nums transition-colors group-hover:text-sky-500">
            {formatWeiboCount(item.stats.comments)}
          </span>
        </Button>
      )
    }

    if (id === 'repost') {
      return (
        <Button
          key={id}
          type="button"
          variant="ghost"
          aria-label="转发微博"
          className="group rounded-full py-2 font-normal transition-transform hover:bg-emerald-50 hover:text-emerald-500 active:scale-[0.96]"
          onClick={(event) => {
            event.stopPropagation()
            onRepostClick?.(item)
          }}
        >
          <Repeat2 className="size-3.5 transition-colors group-hover:text-emerald-500" />
          <span className="tabular-nums transition-colors group-hover:text-emerald-500">
            {formatWeiboCount(item.stats.reposts)}
          </span>
        </Button>
      )
    }

    return (
      <Button
        key={id}
        type="button"
        variant="ghost"
        aria-label={liked ? '取消点赞' : '点赞微博'}
        aria-pressed={liked}
        disabled={likePending}
        className="group rounded-full py-2 font-normal transition-transform hover:bg-rose-50 hover:text-rose-500 active:scale-[0.96]"
        onClick={(event) => {
          event.stopPropagation()
          onLikeClick?.(item)
        }}
      >
        <Heart
          className={cn(
            'size-3.5 transition-colors group-hover:text-rose-500',
            liked && 'fill-rose-500 text-rose-500',
          )}
        />
        <span
          className={cn(
            'tabular-nums transition-colors group-hover:text-rose-500',
            liked && 'text-rose-500',
          )}
        >
          {formatWeiboCount(item.stats.likes)}
        </span>
      </Button>
    )
  }

  function renderToolbarButton(id: FeedToolbarButtonId) {
    if (id === 'gen-image' && onGenImage) {
      return (
        <Button
          key={id}
          type="button"
          variant="ghost"
          aria-label="生图"
          className="group rounded-full py-2 font-normal transition-transform hover:bg-violet-50 hover:text-violet-500 active:scale-[0.96]"
          onClick={(event) => {
            event.stopPropagation()
            onGenImage()
          }}
        >
          <Image className="size-3.5 transition-colors group-hover:text-violet-500" />
        </Button>
      )
    }

    if (id === 'download-media' && canDownload && onDownload) {
      return (
        <Button
          key={id}
          type="button"
          variant="ghost"
          aria-label="批量下载"
          disabled={downloadPending}
          className="group rounded-full py-2 font-normal transition-transform hover:bg-indigo-50 hover:text-indigo-500 active:scale-[0.96]"
          onClick={(event) => {
            event.stopPropagation()
            onDownload()
          }}
        >
          <Download className="size-3.5 transition-colors group-hover:text-indigo-500" />
        </Button>
      )
    }

    if (id === 'favorite' && onFavorite) {
      return (
        <Button
          key={id}
          type="button"
          variant="ghost"
          aria-label={isBookmarked ? '取消收藏' : '收藏'}
          aria-pressed={isBookmarked}
          disabled={favoritePending}
          className="group rounded-full py-2 font-normal transition-transform hover:bg-amber-50 hover:text-amber-500 active:scale-[0.96]"
          onClick={(event) => {
            event.stopPropagation()
            void onFavorite()
          }}
        >
          <Bookmark
            className={cn(
              'size-3.5 transition-colors group-hover:text-amber-500',
              isBookmarked && 'fill-amber-500 text-amber-500',
            )}
          />
        </Button>
      )
    }

    if (id === 'copy-link' && item.mblogId && onCopyLink) {
      return (
        <Button
          key={id}
          type="button"
          variant="ghost"
          aria-label="复制链接"
          className="group rounded-full py-2 font-normal transition-transform hover:bg-cyan-50 hover:text-cyan-500 active:scale-[0.96]"
          onClick={(event) => {
            event.stopPropagation()
            onCopyLink()
          }}
        >
          <LinkIcon className="size-3.5 transition-colors group-hover:text-cyan-500" />
        </Button>
      )
    }

    if (id === 'copy-text' && onCopyText) {
      return (
        <Button
          key={id}
          type="button"
          variant="ghost"
          aria-label="复制内容"
          className="group rounded-full py-2 font-normal transition-transform hover:bg-slate-50 hover:text-slate-500 active:scale-[0.96]"
          onClick={(event) => {
            event.stopPropagation()
            onCopyText()
          }}
        >
          <Copy className="size-3.5 transition-colors group-hover:text-slate-500" />
        </Button>
      )
    }

    return null
  }

  const toolbarButtons = toolbarButtonIds.map(renderToolbarButton).filter(Boolean)

  return (
    <div className="text-muted-foreground flex w-full items-center gap-2 text-xs">
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
        {primaryActionOrder.map(renderPrimaryAction)}
      </div>
      {toolbarButtons.length > 0 ? (
        <div className="flex shrink-0 items-center justify-end gap-0.5 px-3">{toolbarButtons}</div>
      ) : null}
    </div>
  )
}

function RetweetedFeedBlock({
  item,
  onNavigate,
  onNavigateProfile,
  onNavigateTopic,
  onCommentClick,
  onRepostClick,
  onLikeClick,
  likePendingForId,
  feedInteractionMode,
  primaryActionOrder,
  toolbarButtonIds,
  onFavorite,
  favoritePendingForId,
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
  primaryActionOrder: FeedPrimaryActionId[]
  toolbarButtonIds: FeedToolbarButtonId[]
  onFavorite?: (target: FeedItem) => void | Promise<void>
  favoritePendingForId: string | null
}) {
  const {
    resolvedItem,
    shouldShowLoadLongText,
    isLongTextLoading,
    hasLongTextError,
    onLoadLongText,
  } = useFeedLongText(item)
  const { openGenImage } = useGenImageDialog()
  const { downloadDialog, downloadLoading, handleDownload } = useFeedCardMediaDownload(resolvedItem)

  const addEntry = useCallback(() => {
    browsingHistoryStore.getState().addEntry(resolvedItem)
  }, [resolvedItem])

  const isDeletedAuthor = !resolvedItem.author.id
  const detailPath = getStatusDetailPath(resolvedItem)
  const canNavigate = feedInteractionMode === 'x' && onNavigate !== undefined && detailPath !== null
  const navigationProps = canNavigate
    ? ({
        role: 'link',
        tabIndex: 0,
        'aria-label': `查看 ${resolvedItem.author.name || '微博'} 的微博详情`,
      } as const)
    : {}

  const handleCopyLink = () => {
    const weiboUrl = `https://weibo.com/${resolvedItem.author.id}/${resolvedItem.mblogId}`
    void navigator.clipboard.writeText(weiboUrl).then(() => {
      toast.success('已复制链接')
    })
  }

  const handleCopyText = () => {
    const copyText = getStatusCopyText(resolvedItem)
    if (!copyText) {
      toast.error('没有可复制的文字')
      return
    }

    void navigator.clipboard
      .writeText(copyText)
      .then(() => {
        toast.success('已复制文字')
      })
      .catch(() => {
        toast.error('复制失败，请稍后再试')
      })
  }

  const handleRetweetedCommentClick = useCallback(
    (target: FeedItem) => {
      if (feedInteractionMode === 'weibo') {
        onNavigate?.(target)
      } else {
        onCommentClick?.(target)
      }
    },
    [feedInteractionMode, onNavigate, onCommentClick],
  )

  const handleRetweetedClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation()
    if (!canNavigate) {
      return
    }
    // 中键或修饰键时不拦截，让 Link 的原生行为处理新标签页打开
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    // 拦截左键点击使用 SPA 导航
    event.preventDefault()
    onNavigate?.(resolvedItem)
  }

  const handleRetweetedKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (!canNavigate) return
    if (event.target !== event.currentTarget) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onNavigate?.(resolvedItem)
  }

  const retweetedCardClassName = cn(
    'xb-feed-card xb-feed-card--compact gap-3 py-4',
    'flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm',
    canNavigate
      ? 'cursor-pointer focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none'
      : 'cursor-default',
  )

  return (
    <Link
      to={canNavigate ? detailPath : ''}
      className={retweetedCardClassName}
      data-testid="feed-card-body"
      onClick={handleRetweetedClick}
      onKeyDown={handleRetweetedKeyDown}
      {...(canNavigate ? navigationProps : { as: 'div' as const })}
    >
      <CardHeader>
        <RetweetedAuthorHeader item={resolvedItem} onNavigateProfile={onNavigateProfile} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
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

        {!isDeletedAuthor && (
          <FeedActions
            item={resolvedItem}
            onCommentClick={handleRetweetedCommentClick}
            onCommentExpand={onNavigate}
            onRepostClick={onRepostClick}
            onLikeClick={onLikeClick}
            likePending={likePendingForId === resolvedItem.id}
            feedInteractionMode={feedInteractionMode}
            primaryActionOrder={primaryActionOrder}
            toolbarButtonIds={toolbarButtonIds}
            favorited={resolvedItem.favorited}
            onFavorite={onFavorite ? () => onFavorite(resolvedItem) : undefined}
            favoritePending={favoritePendingForId === resolvedItem.id}
            onCopyLink={handleCopyLink}
            onCopyText={handleCopyText}
            onGenImage={() => openGenImage(resolvedItem)}
            onDownload={() => void handleDownload()}
            downloadPending={downloadLoading}
          />
        )}
      </CardContent>
      {downloadDialog}
    </Link>
  )
}

export const FeedCard = memo(function FeedCard({
  item,
  surface: surfaceProp = 'timeline',
  onNavigate,
  onCommentClick,
  onRepostClick,
  onNavigateProfile,
  onNavigateTopic,
  onCommentReply,
  onStatusDeleted,
  className,
  uniformHeight,
}: {
  item: FeedItem
  surface?: StatusFeedSurface
  onNavigate?: (item: FeedItem) => void
  onCommentClick?: (item: FeedItem) => void
  onRepostClick?: (item: FeedItem) => void
  onNavigateProfile?: (lookup: ProfileLookup) => void
  onNavigateTopic?: (topic: string) => void
  onCommentReply?: (target: import('@/lib/weibo/models/compose').ComposeTarget) => void
  /** After deleting this status (owner only), e.g. navigate back from detail. */
  onStatusDeleted?: () => void
  className?: string
  uniformHeight?: boolean
}) {
  const {
    feedInteractionMode,
    feedPrimaryActionOrder,
    feedToolbarButtonIds,
    ratingEnabled,
    statusDetailPopupEnabled,
  } = useAppSettings(
    useShallow((s) => ({
      feedInteractionMode: s.feedInteractionMode,
      feedPrimaryActionOrder: s.feedPrimaryActionOrder,
      feedToolbarButtonIds: s.feedToolbarButtonIds,
      ratingEnabled: s.ratingEnabled,
      statusDetailPopupEnabled: s.statusDetailPopupEnabled,
    })),
  )
  const [commentsExpanded, setCommentsExpanded] = useState(false)
  const commentsPanelId = useId()
  const pointerDownPositionRef = useRef<{ x: number; y: number } | null>(null)
  const suppressNextClickRef = useRef(false)
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

  const uid = getCurrentUserUid()
  const showOwnerMenu = uid !== null && uid === resolvedItem.author.id
  const queryClient = useQueryClient()
  const { openGenImage } = useGenImageDialog()
  const { downloadDialog, downloadLoading, handleDownload } = useFeedCardMediaDownload(resolvedItem)
  const moreMenuActionIds = FEED_TOOLBAR_BUTTON_IDS.filter(
    (id) => !feedToolbarButtonIds.includes(id),
  )

  const likeMutation = useMutation({
    mutationFn: async (target: FeedItem) => {
      if (target.liked) {
        await cancelStatusLike(target.id)
      } else {
        await setStatusLike(target.id)
      }
    },
    onMutate: (target: FeedItem) => optimisticallyToggleStatusLike(queryClient, target),
    onSuccess: (_data, target) => {
      if (target.liked) {
        void queryClient.invalidateQueries({ queryKey: ['weibo', 'liked-statuses'] })
      }
    },
    onError: (_error, _target, context) => {
      restoreStatusCacheMutation(queryClient, context)
      toast.error(_error instanceof Error ? _error.message : '操作失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteWeiboStatus(item.id),
    meta: {
      invalidates: [['weibo']],
    },
    onSuccess: () => {
      toast.success('已删除')
      onStatusDeleted?.()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '删除失败')
    },
  })

  const favoriteMutation = useMutation({
    mutationFn: async (target: FeedItem) => {
      if (target.favorited) {
        await destroyFavorite(target.id)
      } else {
        await createFavorite(target.id)
      }
    },
    onMutate: (target: FeedItem) => optimisticallyToggleStatusFavorite(queryClient, target),
    onSuccess: (_data, target) => {
      toast.success(target.favorited ? '取消收藏成功' : '收藏成功')
    },
    onError: (_error, target, context) => {
      restoreStatusCacheMutation(queryClient, context)
      toast.error(_error instanceof Error ? _error.message : '操作失败')
    },
  })

  const unfavoriteMutation = useMutation({
    mutationFn: (targetId: string) => destroyFavorite(targetId),
    onMutate: (targetId: string) => optimisticallyRemoveStatusFromFavorites(queryClient, targetId),
    onSuccess: () => {
      toast.success('取消收藏成功')
    },
    onError: (error, _targetId, context) => {
      restoreStatusCacheMutation(queryClient, context)
      toast.error(error instanceof Error ? error.message : '取消收藏失败')
    },
  })

  const likePendingId =
    likeMutation.isPending && likeMutation.variables ? likeMutation.variables.id : null

  const handleCardMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0) {
      pointerDownPositionRef.current = null
      return
    }

    suppressNextClickRef.current = false
    pointerDownPositionRef.current = { x: event.clientX, y: event.clientY }
  }

  const handleCardMouseUp = (event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || !pointerDownPositionRef.current) {
      return
    }

    const deltaX = event.clientX - pointerDownPositionRef.current.x
    const deltaY = event.clientY - pointerDownPositionRef.current.y
    suppressNextClickRef.current = Math.hypot(deltaX, deltaY) > 4
    pointerDownPositionRef.current = null
  }

  const detailPath = getStatusDetailPath(resolvedItem)
  const canNavigate =
    feedInteractionMode === 'x' &&
    onNavigate !== undefined &&
    statusAllowsCardNavigate(surfaceProp, 'root') &&
    detailPath !== null
  const navigationProps = canNavigate
    ? ({
        role: 'link',
        tabIndex: 0,
        'aria-label': `查看 ${resolvedItem.author.name || '微博'} 的微博详情`,
      } as const)
    : {}

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    if (!canNavigate) {
      return
    }

    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }

    const target = event.target as HTMLElement
    const isOnInteractiveChild = target.closest(
      'a,button,[role="button"],input,textarea,select,label',
    )

    // cmd/ctrl + left click on the inert area → open in new tab. The browser
    // already handles modifier+click on inner <a>/<button> children natively.
    if (
      event.button === 0 &&
      (event.metaKey || event.ctrlKey) &&
      !isOnInteractiveChild &&
      !hasTextSelectionWithin(event.currentTarget) &&
      detailPath !== null
    ) {
      openStatusDetailInNewTab(detailPath)
      return
    }

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }

    const interactiveSelectors = shouldUsePopupMode
      ? 'a,button,[role="button"],input,textarea,select,label,video,audio,img,[data-radix-collection-item]'
      : 'a,button,[role="button"],input,textarea,select,label,video,audio,img,[data-radix-collection-item]'
    if (target !== event.currentTarget && target.closest(interactiveSelectors)) {
      return
    }

    if (hasTextSelectionWithin(event.currentTarget)) {
      return
    }

    event.preventDefault()
    onNavigate?.(resolvedItem)
  }

  const handleCardAuxClick = (event: MouseEvent<HTMLElement>) => {
    if (!canNavigate || event.button !== 1 || detailPath === null) {
      return
    }

    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }

    const target = event.target as HTMLElement
    const interactiveSelectors = shouldUsePopupMode
      ? 'a,button,[role="button"],input,textarea,select,label,video,audio,img,[data-radix-collection-item]'
      : 'a,button,[role="button"],input,textarea,select,label,video,audio,img,[data-radix-collection-item]'
    if (target !== event.currentTarget && target.closest(interactiveSelectors)) {
      return
    }

    if (hasTextSelectionWithin(event.currentTarget)) {
      return
    }

    openStatusDetailInNewTab(detailPath)
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!canNavigate) {
      return
    }

    if (event.target !== event.currentTarget) {
      return
    }

    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    onNavigate?.(resolvedItem)
  }

  const handleCommentExpand = useCallback(() => {
    setCommentsExpanded((prev) => !prev)
  }, [])
  const canExpandInlineComments = feedInteractionMode === 'weibo' && onCommentReply !== undefined

  const handleCopyLink = useCallback((target: FeedItem) => {
    const weiboUrl = `https://weibo.com/${target.author.id}/${target.mblogId}`
    void navigator.clipboard.writeText(weiboUrl).then(() => {
      toast.success('已复制链接')
    })
  }, [])

  const handleCopyText = useCallback((target: FeedItem) => {
    const copyText = getStatusCopyText(target)
    if (!copyText) {
      toast.error('没有可复制的文字')
      return
    }

    void navigator.clipboard
      .writeText(copyText)
      .then(() => {
        toast.success('已复制文字')
      })
      .catch(() => {
        toast.error('复制失败，请稍后再试')
      })
  }, [])

  if (resolvedItem.deleted) {
    return (
      <Card className={cn('xb-feed-card xb-feed-card--compact gap-4 py-4 relative', className)}>
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <p className="text-muted-foreground text-sm">此微博已被删除</p>
          <Button
            variant="outline"
            size="sm"
            disabled={unfavoriteMutation.isPending}
            onClick={(event) => {
              event.stopPropagation()
              void unfavoriteMutation.mutateAsync(resolvedItem.id)
            }}
          >
            <Bookmark className="mr-1 size-3" />
            取消收藏
          </Button>
        </CardContent>
      </Card>
    )
  }

  const cardContentElement = (
    <CardContent
      className="flex flex-col gap-4"
      onMouseDown={handleCardMouseDown}
      onMouseUp={handleCardMouseUp}
    >
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

      {resolvedItem.retweetedStatus ? (
        <RetweetedFeedBlock
          item={resolvedItem.retweetedStatus}
          onNavigate={onNavigate}
          onNavigateProfile={onNavigateProfile}
          onNavigateTopic={onNavigateTopic}
          onLikeClick={(target) => likeMutation.mutate(target)}
          likePendingForId={likePendingId}
          feedInteractionMode={feedInteractionMode}
          primaryActionOrder={feedPrimaryActionOrder}
          toolbarButtonIds={feedToolbarButtonIds}
          onFavorite={(target) => favoriteMutation.mutate(target)}
          favoritePendingForId={favoriteMutation.isPending ? resolvedItem.retweetedStatus.id : null}
        />
      ) : null}
    </CardContent>
  )

  // 当弹窗模式开启时，使用按钮组件；否则使用 Link 组件支持中键在新标签页打开
  const shouldUsePopupMode = statusDetailPopupEnabled && canNavigate
  const cardClassName = cn(
    'group/card py-4 relative',
    uniformHeight ? 'gap-0 flex-1' : 'gap-4',
    'xb-feed-card group/card gap-4 py-4 relative text-left',
    'flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm',
    canNavigate
      ? 'cursor-pointer focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none'
      : 'cursor-default',
    className,
  )

  const cardContent = (
    <>
      <div className="absolute top-4 right-4">
        <FeedCardMoreMenu
          type="status"
          isOwner={showOwnerMenu}
          item={resolvedItem}
          favorited={resolvedItem.favorited}
          onFavorite={() => favoriteMutation.mutateAsync(resolvedItem)}
          contentLabel="这条微博"
          isDeleting={deleteMutation.isPending}
          onDelete={() => deleteMutation.mutateAsync()}
          visibleActionIds={moreMenuActionIds}
          onCopyText={() => handleCopyText(resolvedItem)}
        />
      </div>
      {resolvedItem.title ? (
        <div className={cn('px-4', uniformHeight && 'mb-4')}>
          <Badge variant="secondary">{resolvedItem.title.text}</Badge>
        </div>
      ) : null}
      {uniformHeight ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 px-0">
          <FeedAuthorHeader
            item={resolvedItem}
            onNavigateProfile={onNavigateProfile}
            trailing={
              ratingEnabled ? (
                <RatingSummaryBadge targetUid={resolvedItem.author.id} size="sm" useBatchCache />
              ) : null
            }
          />
          {cardContentElement}
          <div className="flex-1" />
        </div>
      ) : (
        <>
          <FeedAuthorHeader
            item={resolvedItem}
            onNavigateProfile={onNavigateProfile}
            trailing={
              ratingEnabled ? (
                <RatingSummaryBadge targetUid={resolvedItem.author.id} size="sm" useBatchCache />
              ) : null
            }
          />
          {cardContentElement}
        </>
      )}
      <CardFooter>
        <FeedActions
          item={resolvedItem}
          surface={surfaceProp}
          onCommentClick={onCommentClick}
          onCommentExpand={handleCommentExpand}
          commentsExpanded={commentsExpanded}
          commentsPanelId={canExpandInlineComments ? commentsPanelId : undefined}
          onRepostClick={onRepostClick}
          onLikeClick={(target) => likeMutation.mutate(target)}
          likePending={likePendingId === resolvedItem.id}
          feedInteractionMode={feedInteractionMode}
          primaryActionOrder={feedPrimaryActionOrder}
          toolbarButtonIds={feedToolbarButtonIds}
          favorited={resolvedItem.favorited}
          onFavorite={() => favoriteMutation.mutateAsync(resolvedItem)}
          favoritePending={favoriteMutation.isPending}
          onCopyLink={() => handleCopyLink(resolvedItem)}
          onCopyText={() => handleCopyText(resolvedItem)}
          onGenImage={() => openGenImage(resolvedItem)}
          onDownload={() => void handleDownload()}
          downloadPending={downloadLoading}
        />
      </CardFooter>
      {commentsExpanded && canExpandInlineComments ? (
        <FeedCommentsExpanded
          id={commentsPanelId}
          item={resolvedItem}
          onCommentReply={onCommentReply}
          onCollapse={handleCommentExpand}
          onNavigate={onNavigate}
        />
      ) : null}
      {downloadDialog}
    </>
  )

  // 弹窗模式：使用 div + role="button" 避免嵌套 button 的 HTML 错误；
  // 仍然保留 data-slot="card" 以应用玻璃效果
  if (shouldUsePopupMode) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cardClassName}
        data-testid="feed-card-body"
        data-slot="card"
        onClick={handleCardClick}
        onAuxClick={handleCardAuxClick}
        onKeyDown={handleCardKeyDown}
        {...navigationProps}
      >
        {cardContent}
      </div>
    )
  }

  // 非弹窗模式：使用 Link 组件，支持中键在新标签页打开
  return (
    <Link
      to={canNavigate ? detailPath : ''}
      className={cardClassName}
      data-testid="feed-card-body"
      data-slot="card"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      {...(canNavigate ? navigationProps : { as: 'div' as const })}
    >
      {cardContent}
    </Link>
  )
})
