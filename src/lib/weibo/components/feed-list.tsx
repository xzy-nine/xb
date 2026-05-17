import { useAppSettings } from '@/lib/app-settings-store'
import { FeedCard } from '@/lib/weibo/components/feed-card'
import { PageEmptyState } from '@/lib/weibo/components/page-state'
import type { FeedItem } from '@/lib/weibo/models/feed'

export function FeedList({
  items,
  emptyLabel,
  onNavigate,
  onCommentClick,
  onRepostClick,
}: {
  items: FeedItem[]
  emptyLabel: string
  onNavigate?: (item: FeedItem) => void
  onCommentClick?: (item: FeedItem) => void
  onRepostClick?: (item: FeedItem) => void
}) {
  const waterfallFlowEnabled = useAppSettings((s) => s.waterfallFlowEnabled)
  const waterfallCardWidth = useAppSettings((s) => s.waterfallCardWidth)

  if (items.length === 0) {
    return <PageEmptyState label={emptyLabel} />
  }

  if (!waterfallFlowEnabled) {
    return (
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            onNavigate={onNavigate}
            onCommentClick={onCommentClick}
            onRepostClick={onRepostClick}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-stretch gap-4">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col" style={{ width: waterfallCardWidth }}>
          <FeedCard
            item={item}
            onNavigate={onNavigate}
            onCommentClick={onCommentClick}
            onRepostClick={onRepostClick}
            uniformHeight
          />
        </div>
      ))}
    </div>
  )
}
