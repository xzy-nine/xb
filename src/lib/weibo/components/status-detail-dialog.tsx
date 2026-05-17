import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, X } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import type { StatusDetailPopupPosition } from '@/lib/app-settings'
import { useAppSettings } from '@/lib/app-settings-store'
import { cn } from '@/lib/utils'
import { FeedCard } from '@/lib/weibo/components/feed-card'
import { PageErrorState, PageLoadingState } from '@/lib/weibo/components/page-state'
import { composeTargetFromFeedItem } from '@/lib/weibo/models/compose'
import type { ComposeTarget } from '@/lib/weibo/models/compose'
import type { FeedItem, StatusDetailNavigationItem } from '@/lib/weibo/models/feed'
import { StatusCommentsSection } from '@/lib/weibo/pages/status-detail-page'
import { loadStatusDetail } from '@/lib/weibo/services/weibo-repository'

interface StatusDetailDialogProps {
  open: boolean
  item: StatusDetailNavigationItem | null
  position: StatusDetailPopupPosition
  onOpenChange: (open: boolean) => void
  setComposeTarget: (target: ComposeTarget | null) => void
  onNavigate?: (item: FeedItem) => void
}

export function StatusDetailDialog({
  open,
  item,
  position,
  onOpenChange,
  setComposeTarget,
  onNavigate,
}: StatusDetailDialogProps) {
  if (!open || !item) {
    return null
  }

  const statusId = item.mblogId ?? item.id
  const authorId = item.author.id

  const glassOpacity = useAppSettings((s) => s.glassOpacity)
  const glassBlur = useAppSettings((s) => s.glassBlur)

  const glassPanelStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundColor: `color-mix(in srgb, var(--background) ${glassOpacity}%, transparent)`,
      backdropFilter: `blur(${glassBlur}px)`,
      borderColor: `color-mix(in srgb, var(--border) ${glassOpacity}%, transparent)`,
    }),
    [glassOpacity, glassBlur],
  )

  const glassOverlayStyle = useMemo<React.CSSProperties>(
    () => ({
      backgroundColor: `rgba(0,0,0,${0.5 * (1 - glassOpacity / 100) + 0.15})`,
    }),
    [glassOpacity],
  )

  const isGlassEffect = glassBlur > 0 || glassOpacity < 100

  const panelClasses = cn(
    'bg-background relative w-[calc(100%-80px)] max-w-[700px] overflow-y-auto shadow-2xl',
    position === 'left' && 'mr-auto h-full rounded-r-2xl',
    position === 'center' && 'mx-auto my-2 h-[calc(100vh-1rem)] rounded-2xl',
    position === 'right' && 'ml-auto h-full rounded-l-2xl',
  )

  const detailQuery = useQuery({
    queryKey: ['weibo', 'status', statusId],
    queryFn: () => loadStatusDetail(statusId),
    enabled: statusId !== '',
  })

  const detail = detailQuery.data

  const headerClasses = cn(
    'bg-background/95 sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4 backdrop-blur',
    position === 'left' && 'rounded-tr-2xl',
    position === 'center' && 'rounded-t-2xl',
    position === 'right' && 'rounded-tl-2xl',
  )

  return (
    <div className="fixed inset-0 z-[1500] flex">
      <div
        className="absolute inset-0 bg-black/50"
        style={glassOverlayStyle}
        onClick={() => onOpenChange(false)}
      />
      <div className={panelClasses} style={isGlassEffect ? glassPanelStyle : undefined}>
        <div className={headerClasses}>
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="size-4" />
            返回
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="p-4">
          {detailQuery.isLoading ? <PageLoadingState label="正在加载此微博..." /> : null}
          {detailQuery.error instanceof Error ? (
            <PageErrorState description={detailQuery.error.message} />
          ) : null}
          {detail ? (
            <div className="flex flex-col gap-4">
              <FeedCard
                item={detail.status}
                surface="detail"
                onNavigate={onNavigate}
                onCommentClick={(item) =>
                  setComposeTarget(composeTargetFromFeedItem(item, 'comment'))
                }
                onRepostClick={(item) =>
                  setComposeTarget(composeTargetFromFeedItem(item, 'repost'))
                }
                onStatusDeleted={() => onOpenChange(false)}
              />
              <div className="border-t pt-4">
                <h3 className="text-muted-foreground mb-4 text-sm font-medium">评论</h3>
                <StatusCommentsSection
                  statusId={detail.status.id}
                  authorId={authorId}
                  onCommentReply={setComposeTarget}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
