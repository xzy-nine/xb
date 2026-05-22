import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Clock, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { TimelineTopBar } from '@/lib/weibo/components/timeline-top-bar'
import {
  MAX_ENTRIES,
  browsingHistoryStore,
  useBrowsingHistory,
} from '@/lib/weibo/hooks/use-browsing-history'

function formatReadAt(timestamp: number): string {
  const date = new Date(timestamp)
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60_000) {
    return '刚刚'
  }

  if (diff < 3_600_000) {
    return formatDistanceToNow(date, { locale: zhCN, addSuffix: true })
  }

  if (diff < 86_400_000) {
    return format(date, 'HH:mm')
  }

  if (diff < 7 * 86_400_000) {
    return format(date, 'EEE HH:mm', { locale: zhCN })
  }

  return format(date, 'M月d日')
}

export function HistoryPage() {
  const entries = useBrowsingHistory((s) => s.entries)
  const removeEntry = browsingHistoryStore.getState().removeEntry
  const clearHistory = browsingHistoryStore.getState().clearHistory
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const groupedEntries = useMemo(() => {
    const groups: Array<{ label: string; entries: typeof entries }> = []
    const now = Date.now()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const todayTs = today.getTime()
    const yesterdayTs = todayTs - 86_400_000
    const thisWeekTs = todayTs - 6 * 86_400_000

    const todayEntries: typeof entries = []
    const yesterdayEntries: typeof entries = []
    const thisWeekEntries: typeof entries = []
    const earlierEntries: typeof entries = []

    for (const entry of entries) {
      if (entry.readAt >= todayTs) {
        todayEntries.push(entry)
      } else if (entry.readAt >= yesterdayTs) {
        yesterdayEntries.push(entry)
      } else if (entry.readAt >= thisWeekTs) {
        thisWeekEntries.push(entry)
      } else {
        earlierEntries.push(entry)
      }
    }

    if (todayEntries.length > 0) groups.push({ label: '今天', entries: todayEntries })
    if (yesterdayEntries.length > 0) groups.push({ label: '昨天', entries: yesterdayEntries })
    if (thisWeekEntries.length > 0) groups.push({ label: '本周', entries: thisWeekEntries })
    if (earlierEntries.length > 0) groups.push({ label: '更早', entries: earlierEntries })

    return groups
  }, [entries])

  return (
    <div className="flex flex-col gap-3">
      <TimelineTopBar
        title="浏览历史"
        subtitle={`最多保存 ${MAX_ENTRIES} 条`}
        rightAction={
          entries.length > 0 ? (
            <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                >
                  清空
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>清空浏览历史</DialogTitle>
                  <DialogDescription>确定要清除所有浏览记录吗？此操作不可撤销。</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">取消</Button>
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      clearHistory()
                      setClearConfirmOpen(false)
                    }}
                  >
                    清空
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {entries.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-12">
          <Clock className="size-8 opacity-50" />
          <p className="text-sm">暂无浏览历史</p>
        </div>
      ) : (
        <ItemGroup>
          {groupedEntries.map((group) => (
            <div key={group.label}>
              <ItemHeader className="px-4 py-2">
                <ItemTitle className="text-muted-foreground text-xs font-medium">
                  {group.label}
                </ItemTitle>
              </ItemHeader>
              {group.entries.map((entry) => {
                const to =
                  entry.statusId && entry.authorId
                    ? `/${entry.authorId}/${entry.statusId}`
                    : `/u/${entry.authorId}`
                return (
                  <Item key={entry.id} asChild size="sm">
                    <Link to={to}>
                      <ItemMedia variant="image">
                        <Avatar className="size-9">
                          {entry.authorAvatar && <AvatarImage src={entry.authorAvatar} />}
                          <AvatarFallback className="text-xs">
                            {entry.authorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          <span>{entry.authorName}</span>
                          <span className="text-muted-foreground ml-auto text-xs font-normal">
                            {formatReadAt(entry.readAt)}
                          </span>
                        </ItemTitle>
                        <ItemDescription>{entry.textSnippet}</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            removeEntry(entry.id)
                          }}
                          aria-label="移除"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </ItemActions>
                    </Link>
                  </Item>
                )
              })}
            </div>
          ))}
        </ItemGroup>
      )}
    </div>
  )
}
