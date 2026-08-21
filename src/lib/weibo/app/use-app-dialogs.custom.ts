import { useCallback, useState } from 'react'

import type { StatusDetailNavigationItem } from '@/lib/weibo/models/feed'

export type ProfileLookup = { uid: string } | { screenName: string }

interface UseAppDialogsOptions {
  navigate: (path: string) => void
  statusDetailPopupEnabled: boolean
}

export interface AppDialogsState {
  statusDetailDialogOpen: boolean
  statusDetailItem: StatusDetailNavigationItem | null
  profileDialogOpen: boolean
  profileLookup: ProfileLookup | null
  topicDialogOpen: boolean
  topicDialogTopic: string | null
}

export interface AppDialogsActions {
  setStatusDetailDialogOpen: (open: boolean) => void
  setProfileDialogOpen: (open: boolean) => void
  setTopicDialogOpen: (open: boolean) => void
  openStatusDetailDialog: (item: StatusDetailNavigationItem) => void
  navigateToProfile: (lookup: ProfileLookup) => void
  openProfileDialog: (lookup: ProfileLookup) => void
  openTopicDialog: (topic: string) => void
}

export function useAppDialogs({
  navigate,
  statusDetailPopupEnabled,
}: UseAppDialogsOptions): AppDialogsState & AppDialogsActions {
  const [statusDetailDialogOpen, setStatusDetailDialogOpen] = useState(false)
  const [statusDetailItem, setStatusDetailItem] = useState<StatusDetailNavigationItem | null>(null)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const [profileLookup, setProfileLookup] = useState<ProfileLookup | null>(null)
  const [topicDialogOpen, setTopicDialogOpen] = useState(false)
  const [topicDialogTopic, setTopicDialogTopic] = useState<string | null>(null)

  const openStatusDetailDialog = useCallback((item: StatusDetailNavigationItem) => {
    setStatusDetailItem(item)
    setStatusDetailDialogOpen(true)
  }, [])

  const navigateToProfile = useCallback(
    (lookup: ProfileLookup) => {
      if (statusDetailPopupEnabled) {
        setProfileLookup(lookup)
        setProfileDialogOpen(true)
      } else {
        if ('uid' in lookup && lookup.uid) {
          navigate(`/u/${lookup.uid}`)
        } else if ('screenName' in lookup && lookup.screenName) {
          navigate(`/n/${encodeURIComponent(lookup.screenName)}`)
        }
      }
    },
    [navigate, statusDetailPopupEnabled],
  )

  const openProfileDialog = useCallback((lookup: ProfileLookup) => {
    setProfileLookup(lookup)
    setProfileDialogOpen(true)
  }, [])

  const openTopicDialog = useCallback((topic: string) => {
    setTopicDialogTopic(topic)
    setTopicDialogOpen(true)
  }, [])

  return {
    statusDetailDialogOpen,
    statusDetailItem,
    profileDialogOpen,
    profileLookup,
    topicDialogOpen,
    topicDialogTopic,
    setStatusDetailDialogOpen,
    setProfileDialogOpen,
    setTopicDialogOpen,
    openStatusDetailDialog,
    navigateToProfile,
    openProfileDialog,
    openTopicDialog,
  }
}
