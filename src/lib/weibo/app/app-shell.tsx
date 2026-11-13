import { useQueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useShallow } from 'zustand/react/shallow'

import type { HomeTab } from '@/lib/app-settings'
import { useAppSettings } from '@/lib/app-settings-store'
import {
  AppShellContextProvider,
  type AppShellContextValue,
} from '@/lib/weibo/app/app-shell-context'
import { RewritePausedCard, ShellFrame } from '@/lib/weibo/app/app-shell-layout'
import {
  createMainScrollRoot,
  readMainScrollRoot,
  resetMainScrollRoot,
  scrollMainScrollRootToTop,
} from '@/lib/weibo/app/main-scroll-root'
import { createBrowserPageRuntime, PageRuntimeProvider } from '@/lib/weibo/app/page-runtime'
import { AuthRequiredDialog } from '@/lib/weibo/components/auth-required-dialog'
import { CommentModal } from '@/lib/weibo/components/comment-modal'
import { ComposeDialog } from '@/lib/weibo/components/compose-dialog'
import { GenImageDialogProvider } from '@/lib/weibo/components/gen-image-dialog-context'
import { SettingsDialog } from '@/lib/weibo/components/settings-dialog'
import { type StatusCardHost, StatusCardHostProvider } from '@/lib/weibo/components/status-card'
import { followGroupsQueryOptions } from '@/lib/weibo/data/weibo-data'
import { composeTargetFromFeedItem, type ComposeTarget } from '@/lib/weibo/models/compose'
import { getDefaultFollowGroupForHomeTab } from '@/lib/weibo/models/explore-utils'
import type { StatusDetailNavigationItem } from '@/lib/weibo/models/feed'
import { homeTimelinePathFromTab } from '@/lib/weibo/route/home-timeline-path'
import { useWeiboPage } from '@/lib/weibo/route/use-weibo-page'
import { onUnauthorized } from '@/lib/weibo/services/auth-events'
import { ColumnPickerDialog } from '@/lib/weibo/workspace/column-picker-dialog'
import { useWorkspace } from '@/lib/weibo/workspace/workspace-store'

import { AppShellDialogs } from './app-shell-dialogs.custom'
import { useAppDialogs } from './use-app-dialogs.custom'

const GenImageDialog = lazy(() =>
  import('@/lib/weibo/components/gen-image-dialog').then((m) => ({ default: m.GenImageDialog })),
)

export function AppShell() {
  const navigate = useNavigate()
  const page = useWeiboPage()
  const queryClient = useQueryClient()

  const {
    theme,
    rewriteEnabled,
    contentWidth,
    customContentWidth,
    multiColumnEnabled,
    statusDetailPopupEnabled,
    statusDetailPopupPosition,
    statusDetailPopupWidth,
    updateSettings,
  } = useAppSettings(
    useShallow((state) => ({
      theme: state.theme,
      rewriteEnabled: state.rewriteEnabled,
      contentWidth: state.contentWidth,
      customContentWidth: state.customContentWidth,
      multiColumnEnabled: state.multiColumnEnabled,
      statusDetailPopupEnabled: state.statusDetailPopupEnabled,
      statusDetailPopupPosition: state.statusDetailPopupPosition,
      statusDetailPopupWidth: state.statusDetailPopupWidth,
      updateSettings: state.updateSettings,
    })),
  )
  const [composeTarget, setComposeTarget] = useState<ComposeTarget | null>(null)
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [columnPickerOpen, setColumnPickerOpen] = useState(false)
  const [mainScrollRoot] = useState(createMainScrollRoot)
  const homeTabNavigationRequestRef = useRef(0)
  const auxiliaryColumns = useWorkspace((state) => state.auxiliaryColumns)
  const removeColumn = useWorkspace((state) => state.removeColumn)
  const moveColumn = useWorkspace((state) => state.moveColumn)
  const focusColumn = useWorkspace((state) => state.focusColumn)
  const focusedColumnId = useWorkspace((state) => state.focusedColumnId)
  const canvasScrollLeft = useWorkspace((state) => state.canvasScrollLeft)
  const setCanvasScrollLeft = useWorkspace((state) => state.setCanvasScrollLeft)
  const setColumnWidth = useWorkspace((state) => state.setColumnWidth)

  const persistWorkspaceChange = useCallback((change: Promise<unknown>) => {
    void change.catch(() => toast.error('无法保存多列工作区配置'))
  }, [])
  const handleCanvasScrollLeftChange = useCallback(
    (scrollLeft: number) => {
      persistWorkspaceChange(setCanvasScrollLeft(scrollLeft))
    },
    [persistWorkspaceChange, setCanvasScrollLeft],
  )

  const dialogs = useAppDialogs({ navigate, statusDetailPopupEnabled })

  useEffect(() => onUnauthorized(() => setAuthDialogOpen(true)), [])

  const pageRuntime = useMemo(
    () =>
      createBrowserPageRuntime({
        page,
        navigate,
        getScrollRoot: () => readMainScrollRoot(mainScrollRoot),
        canGoBack: window.history.length > 2 && page.kind !== 'home',
      }),
    [mainScrollRoot, navigate, page],
  )

  const resetMainScroll = useCallback(() => {
    resetMainScrollRoot(mainScrollRoot)
  }, [mainScrollRoot])

  const scrollMainToTop = useCallback(() => {
    scrollMainScrollRootToTop(mainScrollRoot)
  }, [mainScrollRoot])

  const navigateToStatusDetail = useCallback(
    (item: StatusDetailNavigationItem) => {
      const statusId = item.mblogId ?? item.id
      if (!item.author.id || !statusId) {
        return
      }
      if (statusDetailPopupEnabled) {
        dialogs.openStatusDetailDialog(item)
      } else {
        navigate(`/${item.author.id}/${statusId}`)
      }
    },
    [navigate, statusDetailPopupEnabled, dialogs],
  )

  const handleSetComposeTarget = useCallback((target: ComposeTarget | null) => {
    setComposeTarget(target)
  }, [])

  const refreshTimeline = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['weibo', 'timeline'] })
  }, [queryClient])

  const onHomeTabChange = useCallback(
    (tab: HomeTab) => {
      const requestId = ++homeTabNavigationRequestRef.current
      if (tab === 'special-follow' || tab === 'friend-circle') {
        void updateSettings({ homeTab: tab, homeGroupId: null })
        void queryClient
          .ensureQueryData(followGroupsQueryOptions)
          .then((groups) => {
            if (requestId === homeTabNavigationRequestRef.current) {
              const group = getDefaultFollowGroupForHomeTab(groups.defaultGroups, tab)
              void updateSettings({ homeTab: tab, homeGroupId: group?.gid ?? null })
              navigate(group ? `/mygroups?gid=${group.gid}` : '/mygroups')
            }
          })
          .catch(() => {
            if (requestId === homeTabNavigationRequestRef.current) {
              void updateSettings({ homeTab: tab, homeGroupId: null })
              navigate(homeTimelinePathFromTab(tab))
            }
          })
        return
      }

      void updateSettings({ homeTab: tab, homeGroupId: null })
      navigate(homeTimelinePathFromTab(tab))
    },
    [navigate, queryClient, updateSettings],
  )

  const onFollowGroupChange = useCallback(
    (gid: string | null) => {
      ++homeTabNavigationRequestRef.current
      void updateSettings({ homeTab: 'following', homeGroupId: gid })
      if (gid) {
        navigate('/mygroups?gid=' + gid)
      } else {
        navigate('/mygroups')
      }
    },
    [navigate, updateSettings],
  )

  const context: AppShellContextValue = useMemo(
    () => ({
      page,
      navigateToStatusDetail,
      openStatusDetailDialog: dialogs.openStatusDetailDialog,
      navigateToProfile: dialogs.navigateToProfile,
      openProfileDialog: dialogs.openProfileDialog,
      openTopicDialog: dialogs.openTopicDialog,
      resetMainScroll,
      scrollMainToTop,
      composeTarget,
      setComposeTarget: handleSetComposeTarget,
      viewingProfileUserId,
      onProfileUserIdChange: setViewingProfileUserId,
      onHomeTabChange,
      refreshTimeline,
      onFollowGroupChange,
    }),
    [
      page,
      navigateToStatusDetail,
      dialogs.openStatusDetailDialog,
      dialogs.navigateToProfile,
      dialogs.openProfileDialog,
      dialogs.openTopicDialog,
      resetMainScroll,
      scrollMainToTop,
      composeTarget,
      handleSetComposeTarget,
      viewingProfileUserId,
      onHomeTabChange,
      refreshTimeline,
      onFollowGroupChange,
    ],
  )

  const composeModal = (
    <CommentModal
      open={composeTarget !== null}
      target={composeTarget}
      onOpenChange={(open) => {
        if (!open) {
          handleSetComposeTarget(null)
        }
      }}
    />
  )

  const statusCardHost = useMemo<StatusCardHost>(
    () => ({
      openStatus: pageRuntime.openStatus,
      composeStatus: (status, mode) => setComposeTarget(composeTargetFromFeedItem(status, mode)),
    }),
    [pageRuntime],
  )

  if (!rewriteEnabled) {
    return (
      <>
        <RewritePausedCard onResume={() => void updateSettings({ rewriteEnabled: true })} />
        {composeModal}
        <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
        <AppShellDialogs
          statusDetailDialogOpen={dialogs.statusDetailDialogOpen}
          statusDetailItem={dialogs.statusDetailItem}
          profileDialogOpen={dialogs.profileDialogOpen}
          profileLookup={dialogs.profileLookup}
          topicDialogOpen={dialogs.topicDialogOpen}
          topicDialogTopic={dialogs.topicDialogTopic}
          position={statusDetailPopupPosition}
          width={statusDetailPopupWidth}
          setStatusDetailDialogOpen={dialogs.setStatusDetailDialogOpen}
          setProfileDialogOpen={dialogs.setProfileDialogOpen}
          setTopicDialogOpen={dialogs.setTopicDialogOpen}
          setComposeTarget={handleSetComposeTarget}
        />
      </>
    )
  }

  // When route is unsupported, shell-state hides the xb container and
  // restores Weibo's native UI. Skip rendering the shell frame here.
  if (page.kind === 'unsupported') {
    return null
  }

  return (
    <GenImageDialogProvider>
      <AppShellContextProvider value={context}>
        <StatusCardHostProvider host={statusCardHost}>
          <ShellFrame
            pageKind={page.kind}
            viewingProfileUserId={viewingProfileUserId}
            rewriteEnabled={rewriteEnabled}
            theme={theme}
            contentWidth={contentWidth}
            customContentWidth={customContentWidth}
            multiColumnEnabled={multiColumnEnabled}
            onRewriteEnabledChange={(enabled: boolean) => {
              void updateSettings({ rewriteEnabled: enabled })
              if (!enabled) {
                window.location.reload()
              }
            }}
            onThemeChange={(nextTheme: typeof theme) => void updateSettings({ theme: nextTheme })}
            onSettingsOpen={() => setSettingsOpen(true)}
            onComposeOpen={() => setComposeOpen(true)}
            onSidebarCollapsedChange={(collapsed) =>
              void updateSettings({ sidebarCollapsed: collapsed })
            }
            auxiliaryColumns={auxiliaryColumns}
            onColumnPickerOpen={() => setColumnPickerOpen(true)}
            onRemoveAuxiliaryColumn={(columnId) => persistWorkspaceChange(removeColumn(columnId))}
            onMoveAuxiliaryColumn={(columnId, targetIndex) => moveColumn(columnId, targetIndex)}
            onWidthAuxiliaryColumn={(columnId, width) => setColumnWidth(columnId, width)}
            onMainWidthChange={(width) => updateSettings({ customColumnWidth: width })}
            onFocusAuxiliaryColumn={(columnId) => persistWorkspaceChange(focusColumn(columnId))}
            focusedColumnId={focusedColumnId}
            canvasScrollLeft={canvasScrollLeft}
            onCanvasScrollLeftChange={handleCanvasScrollLeftChange}
            appShellContext={context}
            mainRef={mainScrollRoot}
          >
            <PageRuntimeProvider runtime={pageRuntime}>
              <Outlet context={context} />
            </PageRuntimeProvider>
            {composeModal}
            <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            <Suspense fallback={null}>
              <GenImageDialog />
            </Suspense>
            <AuthRequiredDialog
              open={authDialogOpen}
              onLogin={async () => {
                await updateSettings({ rewriteEnabled: false })
                window.location.assign('https://weibo.com/newlogin')
              }}
            />
            <AppShellDialogs
              statusDetailDialogOpen={dialogs.statusDetailDialogOpen}
              statusDetailItem={dialogs.statusDetailItem}
              profileDialogOpen={dialogs.profileDialogOpen}
              profileLookup={dialogs.profileLookup}
              topicDialogOpen={dialogs.topicDialogOpen}
              topicDialogTopic={dialogs.topicDialogTopic}
              position={statusDetailPopupPosition}
              width={statusDetailPopupWidth}
              setStatusDetailDialogOpen={dialogs.setStatusDetailDialogOpen}
              setProfileDialogOpen={dialogs.setProfileDialogOpen}
              setTopicDialogOpen={dialogs.setTopicDialogOpen}
              setComposeTarget={handleSetComposeTarget}
            />
          </ShellFrame>
          <ColumnPickerDialog
            open={columnPickerOpen}
            onOpenChange={setColumnPickerOpen}
            primaryPage={page}
          />
        </StatusCardHostProvider>
      </AppShellContextProvider>
    </GenImageDialogProvider>
  )
}
