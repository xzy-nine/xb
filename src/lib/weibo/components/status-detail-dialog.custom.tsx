import { useQuery } from '@tanstack/react-query'

import { DialogContainer } from '@/lib/weibo/components/dialog-container.custom'
import { PageErrorState, PageLoadingState } from '@/lib/weibo/components/page-state'
import { DetailStatusCard } from '@/lib/weibo/components/status-card'
import { loadStatusDetail } from '@/lib/weibo/data/weibo-io'
import type { ComposeTarget } from '@/lib/weibo/models/compose'
import type { StatusDetailNavigationItem } from '@/lib/weibo/models/feed'
import { StatusCommentsSection } from '@/lib/weibo/pages/status-detail-page'

interface StatusDetailDialogProps {
  open: boolean
  item: StatusDetailNavigationItem | null
  position: string
  width?: number
  onOpenChange: (open: boolean) => void
  setComposeTarget: (target: ComposeTarget | null) => void
}

export function StatusDetailDialog({
  open,
  item,
  position,
  width,
  onOpenChange,
  setComposeTarget,
}: StatusDetailDialogProps) {
  if (!open || !item) {
    return null
  }

  return (
    <StatusDetailDialogContent
      item={item}
      position={position}
      width={width}
      onOpenChange={onOpenChange}
      setComposeTarget={setComposeTarget}
    />
  )
}

function StatusDetailDialogContent({
  item,
  position,
  width,
  onOpenChange,
  setComposeTarget,
}: Omit<StatusDetailDialogProps, 'open' | 'item'> & { item: StatusDetailNavigationItem }) {
  const statusId = item.mblogId ?? item.id
  const authorId = item.author.id

  const detailQuery = useQuery({
    queryKey: ['weibo', 'status', statusId],
    queryFn: () => loadStatusDetail(statusId),
    enabled: statusId !== '',
  })

  const detail = detailQuery.data

  return (
    <DialogContainer open position={position as any} width={width} onOpenChange={onOpenChange}>
      {detailQuery.isLoading ? <PageLoadingState label="正在加载此微博..." /> : null}
      {detailQuery.error instanceof Error ? (
        <PageErrorState description={detailQuery.error.message} />
      ) : null}
      {detail ? (
        <div className="flex flex-col gap-4">
          <DetailStatusCard status={detail.status} />
          <div className="border-t pt-4">
            <h3 className="text-muted-foreground mb-4 text-sm font-medium">评论</h3>
            <StatusCommentsSection
              statusId={detail.status.id}
              authorId={authorId}
              authorName={detail.status.author.name}
              statusText={detail.status.text}
              commentsCount={detail.status.stats.comments}
              onCommentReply={setComposeTarget}
            />
          </div>
        </div>
      ) : null}
    </DialogContainer>
  )
}
