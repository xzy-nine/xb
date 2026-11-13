import { skipToken, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { loadProfileHoverCard } from '@/lib/weibo/data/weibo-data'
import { getCurrentUserUid } from '@/lib/weibo/platform/current-user'
import type { WeiboPageDescriptor } from '@/lib/weibo/route/page-descriptor'
import { parseProfileSearchUrlState } from '@/lib/weibo/route/profile-search-params'
import {
  columnSourceIdentity,
  columnSourceTitle,
  type ColumnSource,
  useWorkspace,
} from '@/lib/weibo/workspace/workspace-store'

interface ColumnOption {
  source: ColumnSource
}

const BASE_COLUMN_OPTIONS: ColumnOption[] = [
  { source: { kind: 'home', tab: 'for-you' } },
  { source: { kind: 'home', tab: 'following' } },
  { source: { kind: 'home', tab: 'special-follow' } },
  { source: { kind: 'home', tab: 'friend-circle' } },
  { source: { kind: 'explore' } },
  { source: { kind: 'notifications' } },
  { source: { kind: 'hot-search' } },
  { source: { kind: 'search-entry' } },
  { source: { kind: 'history' } },
  { source: { kind: 'followed-super-topics' } },
]

export function ColumnPickerDialog({
  open,
  onOpenChange,
  primaryPage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  primaryPage: WeiboPageDescriptor
}) {
  const auxiliaryColumns = useWorkspace((state) => state.auxiliaryColumns)
  const addColumn = useWorkspace((state) => state.addColumn)
  const primaryProfileLookup =
    primaryPage.kind === 'profile'
      ? primaryPage.profileSource === 'u'
        ? { uid: primaryPage.profileId }
        : { screenName: primaryPage.profileId }
      : null
  const primaryProfileQuery = useQuery({
    queryKey: ['weibo', 'column-picker', 'profile', primaryPage],
    queryFn: primaryProfileLookup ? () => loadProfileHoverCard(primaryProfileLookup) : skipToken,
    enabled: open && primaryProfileLookup !== null,
  })
  const currentUserOption = useMemo<ColumnOption | null>(() => {
    const uid = getCurrentUserUid()
    return uid ? { source: { kind: 'saved', uid } } : null
  }, [])
  const currentPageOptions = useMemo<ColumnOption[]>(() => {
    if (primaryPage.kind === 'profile') {
      const search = parseProfileSearchUrlState(new URLSearchParams(window.location.search))
      return [
        {
          source: {
            kind: 'profile',
            profileId: primaryPage.profileId,
            profileSource: primaryPage.profileSource,
            ...(primaryProfileQuery.data?.name ? { label: primaryProfileQuery.data.name } : {}),
            ...(search.active ? { search } : {}),
          },
        },
      ]
    }
    if (primaryPage.kind === 'topic') {
      return [{ source: { kind: 'topic', topic: primaryPage.topic } }]
    }
    if (primaryPage.kind === 'follow') {
      return [{ source: { kind: 'follow', uid: primaryPage.uid, tab: primaryPage.tab } }]
    }
    return []
  }, [primaryPage, primaryProfileQuery.data])
  const options = useMemo(
    () => [
      ...BASE_COLUMN_OPTIONS,
      ...(currentUserOption ? [currentUserOption] : []),
      ...currentPageOptions,
    ],
    [currentPageOptions, currentUserOption],
  )
  // 同一个来源类型下有多个互不相同的选项（如四个首页标签），计数按完整来源而非 kind。
  const addedCountBySource = useMemo(() => {
    const counts = new Map<string, number>()
    for (const column of auxiliaryColumns) {
      const identity = columnSourceIdentity(column.source)
      counts.set(identity, (counts.get(identity) ?? 0) + 1)
    }
    return counts
  }, [auxiliaryColumns])

  const handleAdd = async (source: ColumnSource) => {
    try {
      await addColumn(source)
    } catch {
      toast.error('无法保存列配置')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>添加列</DialogTitle>
          <DialogDescription>同一种列可以重复添加，每个列实例可以独立切换分类。</DialogDescription>
        </DialogHeader>
        <ul className="divide-border/60 divide-y">
          {options.map((option, index) => {
            const title = columnSourceTitle(option.source)
            const addedCount = addedCountBySource.get(columnSourceIdentity(option.source)) ?? 0
            return (
              <li
                key={`${option.source.kind}-${index}`}
                className="flex items-center justify-between gap-3 px-1 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm">{title}</div>
                  {addedCount > 0 ? (
                    <div className="text-muted-foreground text-xs">已添加 {addedCount} 列</div>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`添加${title}列`}
                  onClick={() => void handleAdd(option.source)}
                >
                  添加
                </Button>
              </li>
            )
          })}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
