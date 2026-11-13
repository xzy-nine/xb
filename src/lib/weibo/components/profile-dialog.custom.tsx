import { useQuery } from '@tanstack/react-query'

import { DialogContainer } from '@/lib/weibo/components/dialog-container.custom'
import { PageErrorState, PageLoadingState } from '@/lib/weibo/components/page-state'
import { ProfileHeader } from '@/lib/weibo/components/profile-header'
import { loadProfileHoverCard } from '@/lib/weibo/data/weibo-io'
import { ProfilePostsTabs } from '@/lib/weibo/pages/profile-page'

type ProfileLookup = { uid: string } | { screenName: string }

interface ProfileDialogProps {
  open: boolean
  lookup: ProfileLookup | null
  position: string
  width?: number
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, lookup, position, width, onOpenChange }: ProfileDialogProps) {
  if (!open || !lookup) {
    return null
  }

  return (
    <ProfileDialogContent
      lookup={lookup}
      position={position}
      width={width}
      onOpenChange={onOpenChange}
    />
  )
}

function ProfileDialogContent({
  lookup,
  position,
  width,
  onOpenChange,
}: Omit<ProfileDialogProps, 'open' | 'lookup'> & { lookup: ProfileLookup }) {
  const profileQuery = useQuery({
    queryKey: [
      'weibo',
      'profile',
      'info',
      'uid' in lookup ? 'u' : 'n',
      'uid' in lookup ? lookup.uid : lookup.screenName,
    ],
    queryFn: () => loadProfileHoverCard(lookup),
    enabled: !!lookup,
  })

  const profile = profileQuery.data

  return (
    <DialogContainer open position={position as any} width={width} onOpenChange={onOpenChange}>
      {profileQuery.isLoading ? <PageLoadingState label="正在加载此用户主页..." /> : null}
      {profileQuery.error instanceof Error ? (
        <PageErrorState description={profileQuery.error.message} />
      ) : null}
      {profile ? (
        <div className="flex flex-col gap-4">
          <ProfileHeader profile={profile} />
          <ProfilePostsTabs profileId={profile.id} />
        </div>
      ) : null}
    </DialogContainer>
  )
}
