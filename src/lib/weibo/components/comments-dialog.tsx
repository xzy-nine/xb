import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageEmptyState, PageErrorState } from '@/lib/weibo/components/page-state'
import { flattenInfiniteItems, nestedCommentsInfiniteOptions } from '@/lib/weibo/data/weibo-data'
import type { ComposeTarget } from '@/lib/weibo/models/compose'

import { CommentList } from './comment-list'

interface CommentsDialogProps {
  open: boolean
  rootStatusId: string
  statusId: string
  authorUid: string
  onOpenChange: (open: boolean) => void
  onCommentReply?: (target: ComposeTarget) => void
}

export function CommentsDialog({
  open,
  rootStatusId,
  statusId,
  authorUid,
  onOpenChange,
  onCommentReply,
}: CommentsDialogProps) {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      ...nestedCommentsInfiniteOptions(statusId, authorUid, open),
    })

  const scrollRef = useRef<HTMLDivElement>(null)

  const comments = flattenInfiniteItems(data?.pages)
  const total = data?.pages[0]?.total ?? comments.length

  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl || !hasNextPage || isFetchingNextPage) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl
      if (scrollHeight - scrollTop - clientHeight < 100) {
        fetchNextPage()
      }
    }

    scrollEl.addEventListener('scroll', handleScroll)
    return () => scrollEl.removeEventListener('scroll', handleScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>评论详情</DialogTitle>
          <DialogDescription>共 {total} 条回复</DialogDescription>
        </DialogHeader>

        <div ref={scrollRef} className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : error instanceof Error ? (
            <PageErrorState description={error.message} />
          ) : comments.length === 0 ? (
            <PageEmptyState label="暂无评论" />
          ) : (
            <>
              <CommentList
                comments={comments}
                emptyLabel="此微博暂无评论"
                rootStatusId={rootStatusId}
                authorUid={authorUid ?? undefined}
                onCommentReply={onCommentReply}
              />
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
