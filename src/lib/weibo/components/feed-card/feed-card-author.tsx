import type { ReactNode } from 'react'

import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SmartLink } from '@/lib/weibo/components/smart-link.custom'
import { UserHoverCard } from '@/lib/weibo/components/user-hover-card'
import { CreatedAtBadge, UserAvatar } from '@/lib/weibo/components/user-presenter'
import type { FeedItem } from '@/lib/weibo/models/feed'
import type { StatusCardRole } from '@/lib/weibo/models/status-presentation'

export type ProfileLookup = { uid: string } | { screenName: string }

export function StatusCardAuthor({
  item,
  role,
  trailing,
  onNavigateProfile,
  hideAvatar = false,
  showTimestamp = true,
  showPublishInfo = true,
}: {
  item: Pick<FeedItem, 'author' | 'createdAtLabel' | 'source' | 'regionName'>
  role: StatusCardRole
  trailing?: ReactNode
  onNavigateProfile?: (lookup: ProfileLookup) => void
  hideAvatar?: boolean
  showTimestamp?: boolean
  showPublishInfo?: boolean
}) {
  const isQuoted = role === 'quoted'
  const isDeletedAuthor = !item.author.id

  const navigateToProfile = () => {
    if (onNavigateProfile) {
      onNavigateProfile({ uid: item.author.id })
    }
  }

  const navMode = onNavigateProfile ? 'modal' : 'auto'

  if (isDeletedAuthor) {
    return <div className="text-muted-foreground px-4 text-sm">未知用户</div>
  }

  return (
    <CardHeader className={isQuoted ? 'flex flex-row gap-2 px-4 py-3' : 'flex flex-row gap-3 px-4'}>
      {!hideAvatar ? (
        <UserHoverCard uid={item.author.id}>
          <SmartLink
            to={`/n/${encodeURIComponent(item.author.name)}`}
            mode={navMode}
            onNavigate={navigateToProfile}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          >
            <UserAvatar
              author={item.author}
              sizeClassName={isQuoted ? 'size-9' : 'size-12'}
              fallbackClassName={isQuoted ? 'text-xs font-semibold' : 'text-sm font-semibold'}
            />
          </SmartLink>
        </UserHoverCard>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <UserHoverCard uid={item.author.id}>
            <SmartLink
              to={`/n/${encodeURIComponent(item.author.name)}`}
              mode={navMode}
              onNavigate={navigateToProfile}
              onClick={(e) => e.stopPropagation()}
            >
              <CardTitle
                className={
                  isQuoted
                    ? 'truncate text-sm font-medium hover:underline'
                    : 'truncate text-base hover:underline'
                }
              >
                {item.author.name}
              </CardTitle>
            </SmartLink>
          </UserHoverCard>
          {showTimestamp ? <CreatedAtBadge label={item.createdAtLabel} /> : null}
          {trailing ? (
            <div
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {trailing}
            </div>
          ) : null}
        </div>
        {showPublishInfo && (item.source || item.regionName) ? (
          <CardDescription className="text-xs">
            {[item.source, item.regionName].filter(Boolean).join(' ')}
          </CardDescription>
        ) : null}
      </div>
    </CardHeader>
  )
}
