import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
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
  onOpenChange: (open: boolean) => void
  setComposeTarget: (target: ComposeTarget | null) => void
  onNavigate?: (item: FeedItem) => void
}

export function StatusDetailDialog({
  open,
  item,
  onOpenChange,
  setComposeTarget,
  onNavigate,
}: StatusDetailDialogProps) {
  if (!open || !item) {
    return null
  }

  const statusId = item.mblogId ?? item.id
  const authorId = item.author.id

  const detailQuery = useQuery({
    queryKey: ['weibo', 'status', statusId],
    queryFn: () => loadStatusDetail(statusId),
    enabled: statusId !== '',
  })

  const detail = detailQuery.data

  return (
    <div className="fixed inset-0 z-[1500] flex">
      <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div className="bg-background relative ml-auto h-full w-[calc(100%-80px)] max-w-[700px] overflow-y-auto shadow-2xl">
        <div className="bg-background/95 sticky top-0 z-10 flex h-14 items-center justify-between border-b px-4 backdrop-blur">
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
