import type { StatusDetailPopupPosition } from '@/lib/app-settings'
import { ProfileDialog } from '@/lib/weibo/components/profile-dialog.custom'
import { StatusDetailDialog } from '@/lib/weibo/components/status-detail-dialog.custom'
import { TopicDialog } from '@/lib/weibo/components/topic-dialog.custom'
import type { ComposeTarget } from '@/lib/weibo/models/compose'
import type { StatusDetailNavigationItem } from '@/lib/weibo/models/feed'

import type { ProfileLookup } from './use-app-dialogs.custom'

interface AppShellDialogsProps {
  statusDetailDialogOpen: boolean
  statusDetailItem: StatusDetailNavigationItem | null
  profileDialogOpen: boolean
  profileLookup: ProfileLookup | null
  topicDialogOpen: boolean
  topicDialogTopic: string | null
  position: StatusDetailPopupPosition
  width: number
  setStatusDetailDialogOpen: (open: boolean) => void
  setProfileDialogOpen: (open: boolean) => void
  setTopicDialogOpen: (open: boolean) => void
  setComposeTarget: (target: ComposeTarget | null) => void
}

export function AppShellDialogs({
  statusDetailDialogOpen,
  statusDetailItem,
  profileDialogOpen,
  profileLookup,
  topicDialogOpen,
  topicDialogTopic,
  position,
  width,
  setStatusDetailDialogOpen,
  setProfileDialogOpen,
  setTopicDialogOpen,
  setComposeTarget,
}: AppShellDialogsProps) {
  return (
    <>
      <StatusDetailDialog
        open={statusDetailDialogOpen}
        item={statusDetailItem}
        position={position}
        width={width}
        onOpenChange={setStatusDetailDialogOpen}
        setComposeTarget={setComposeTarget}
      />
      <ProfileDialog
        open={profileDialogOpen}
        lookup={profileLookup}
        position={position}
        width={width}
        onOpenChange={setProfileDialogOpen}
      />
      <TopicDialog
        open={topicDialogOpen}
        topic={topicDialogTopic}
        position={position}
        width={width}
        onOpenChange={setTopicDialogOpen}
      />
    </>
  )
}
