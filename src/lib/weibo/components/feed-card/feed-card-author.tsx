import type { ReactNode } from 'react'

import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SmartLink } from '@/lib/weibo/components/smart-link'
import { UserHoverCard } from '@/lib/weibo/components/user-hover-card'
import { CreatedAtBadge, UserAvatar } from '@/lib/weibo/components/user-presenter'
import type { FeedItem } from '@/lib/weibo/models/feed'

export type ProfileLookup = { uid: string } | { screenName: string }

export function FeedAuthorHeader({
  item,
  trailing,
  onNavigateProfile,
}: {
  item: Pick<FeedItem, 'author' | 'createdAtLabel' | 'source' | 'regionName'>
  trailing?: ReactNode
  onNavigateProfile?: (lookup: ProfileLookup) => void
}) {
  const navigateToProfile = () => {
    if (onNavigateProfile) {
      onNavigateProfile({ uid: item.author.id })
    }
  }

  const navMode = onNavigateProfile ? 'modal' : 'auto'

  return (
    <CardHeader className="flex flex-row gap-3 px-4">
      <UserHoverCard uid={item.author.id}>
        <SmartLink
          to={`/n/${encodeURIComponent(item.author.name)}`}
          mode={navMode}
          onNavigate={navigateToProfile}
          onClick={(e) => e.stopPropagation()}
        >
          <UserAvatar
            author={item.author}
            sizeClassName="size-12"
            fallbackClassName="text-sm font-semibold"
          />
        </SmartLink>
      </UserHoverCard>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <UserHoverCard uid={item.author.id}>
                <SmartLink
                  to={`/n/${encodeURIComponent(item.author.name)}`}
                  mode={navMode}
                  onNavigate={navigateToProfile}
                  onClick={(e) => e.stopPropagation()}
                >
                  <CardTitle className="truncate text-base hover:underline">
                    {item.author.name}
                  </CardTitle>
                </SmartLink>
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

export function RetweetedAuthorHeader({
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

  const navigateToProfile = () => {
    if (onNavigateProfile) {
      onNavigateProfile({ uid: item.author.id })
    }
  }

  const navMode = onNavigateProfile ? 'modal' : 'auto'

  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-2">
      <UserHoverCard uid={item.author.id}>
        <SmartLink
          to={`/n/${encodeURIComponent(item.author.name)}`}
          mode={navMode}
          onNavigate={navigateToProfile}
          onClick={(e) => e.stopPropagation()}
        >
          <UserAvatar
            author={item.author}
            sizeClassName="size-9"
            fallbackClassName="text-xs font-semibold"
          />
        </SmartLink>
      </UserHoverCard>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <UserHoverCard uid={item.author.id}>
            <SmartLink
              to={`/n/${encodeURIComponent(item.author.name)}`}
              mode={navMode}
              onNavigate={navigateToProfile}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-foreground truncate text-sm font-medium hover:underline">
                {item.author.name}
              </p>
            </SmartLink>
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
