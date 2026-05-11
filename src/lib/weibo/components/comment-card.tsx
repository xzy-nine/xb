import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, MessageCircleIcon } from 'lucide-react'
import { memo, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CommentsDialog } from '@/lib/weibo/components/comments-dialog'
import { FeedCardMoreMenu } from '@/lib/weibo/components/feed-card-more-menu'
import { ImageCarousel } from '@/lib/weibo/components/image-carousel'
import { StatusText } from '@/lib/weibo/components/status-text'
import { UserHoverCard } from '@/lib/weibo/components/user-hover-card'
import { CreatedAtBadge, UserAvatar } from '@/lib/weibo/components/user-presenter'
import { useFontSettings } from '@/lib/weibo/hooks/use-font-settings'
import { type ComposeTarget, composeTargetFromComment } from '@/lib/weibo/models/compose'
import type { CommentItem } from '@/lib/weibo/models/status'
import { getCurrentUserUid } from '@/lib/weibo/platform/current-user'
import {
  cancelCommentLike,
  deleteWeiboComment,
  setCommentLike,
} from '@/lib/weibo/services/weibo-repository'

export const CommentCard = memo(function CommentCard({
  item,
  rootStatusId,
  authorUid,
  onCommentReply,
}: {
  item: CommentItem
  rootStatusId: string
  authorUid?: string
  onCommentReply?: (target: ComposeTarget) => void
}) {
  const [showNestedCommentsDialog, setShowNestedCommentsDialog] = useState(false)
  const uid = getCurrentUserUid()
  const showOwnerMenu = uid !== null && uid === item.author.id
  const { fontSizeClass, fontWeightClass, letterSpacingClass, lineHeightClass, fontFamilyClass } =
    useFontSettings()
  const queryClient = useQueryClient()

  const likeMutation = useMutation({
    mutationFn: async (target: CommentItem) => {
      if (target.liked) {
        await cancelCommentLike(target.id)
      } else {
        await setCommentLike(target.id)
      }
    },
    onMutate: (target: CommentItem) => {
      queryClient.cancelQueries({ queryKey: ['weibo'] })

      const previousItems = queryClient.getQueriesData({ queryKey: ['weibo'] })

      queryClient.setQueriesData({ queryKey: ['weibo'] }, (old) => {
        if (!old || typeof old !== 'object') return old

        const updateCommentInTree = (comment: CommentItem): CommentItem => {
          if (comment.id === target.id) {
            return {
              ...comment,
              liked: !comment.liked,
              likeCount: comment.likeCount + (comment.liked ? -1 : 1),
            }
          }
          if ((comment.comments?.length ?? 0) > 0) {
            return {
              ...comment,
              comments: comment.comments!.map(updateCommentInTree),
            }
          }
          return comment
        }

        if ('pages' in old) {
          const data = old as { pages: { items: CommentItem[] }[] }
          return {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map(updateCommentInTree),
            })),
          }
        }
        return old
      })

      return { previousItems }
    },
    onError: (_error, _target, context) => {
      if (context?.previousItems) {
        for (const [queryKey, data] of context.previousItems) {
          queryClient.setQueryData(queryKey, data)
        }
      }
      toast.error(_error instanceof Error ? _error.message : '操作失败')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteWeiboComment(item.id),
    meta: {
      invalidates: [['weibo']],
    },
    onSuccess: () => {
      toast.success('已删除评论')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : '删除失败')
    },
  })

  const liked = item.liked === true

  return (
    <Card className="py-3">
      <CardContent className="flex flex-col gap-2 px-4">
        <div className="flex flex-row gap-3">
          <UserHoverCard uid={item.author.id}>
            <Link
              to={`/n/${encodeURIComponent(item.author.name)}`}
              onClick={(event) => event.stopPropagation()}
            >
              <UserAvatar
                author={item.author}
                sizeClassName="size-9"
                fallbackClassName="text-xs font-semibold"
              />
            </Link>
          </UserHoverCard>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <UserHoverCard uid={item.author.id}>
                  <Link
                    to={`/n/${encodeURIComponent(item.author.name)}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span className="truncate text-sm font-medium hover:underline">
                      {item.author.name}
                    </span>
                  </Link>
                </UserHoverCard>
                <span className="text-muted-foreground text-[11px]">{item.createdAtLabel}</span>
              </div>
              {showOwnerMenu ? (
                <FeedCardMoreMenu
                  type="comment"
                  isOwner={showOwnerMenu}
                  contentLabel="这条评论"
                  isDeleting={deleteMutation.isPending}
                  onDelete={() => deleteMutation.mutateAsync()}
                />
              ) : null}
            </div>
            <div
              className={cn(
                'whitespace-pre-wrap text-foreground mt-1',
                fontSizeClass,
                fontWeightClass,
                letterSpacingClass,
                lineHeightClass,
                fontFamilyClass,
              )}
            >
              <StatusText item={item} text={item.text || ''} />
            </div>
          </div>
        </div>

        <ImageCarousel images={item.images} />

        {(item.comments?.length ?? 0) > 0 ? (
          <div className="flex flex-col gap-2">
            {item.comments!.map((child) => (
              <CommentCard
                key={child.id}
                item={child}
                rootStatusId={rootStatusId}
                authorUid={authorUid}
                onCommentReply={onCommentReply}
              />
            ))}
            {item.moreInfoText && authorUid ? (
              <Button
                type="button"
                className="mt-1"
                variant="secondary"
                onClick={() => setShowNestedCommentsDialog(true)}
              >
                {item.moreInfoText}
              </Button>
            ) : null}
          </div>
        ) : null}

        <CommentsDialog
          open={showNestedCommentsDialog}
          statusId={item.id}
          authorUid={authorUid ?? ''}
          onOpenChange={setShowNestedCommentsDialog}
          onCommentReply={onCommentReply}
        />

        <div className="text-muted-foreground flex items-center gap-4 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="回复评论"
            onClick={() => onCommentReply?.(composeTargetFromComment(rootStatusId, item))}
          >
            <MessageCircleIcon className="size-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="gap-1 text-xs"
            size="sm"
            aria-label={liked ? '取消点赞' : '点赞评论'}
            aria-pressed={liked}
            disabled={likeMutation.isPending}
            onClick={() => likeMutation.mutate(item)}
          >
            <Heart
              className={cn(
                'size-3 transition-colors hover:text-rose-500',
                liked && 'fill-rose-500 text-rose-500',
              )}
            />
            <span className={cn(liked && 'text-rose-500')}>{item.likeCount}</span>
          </Button>
          {item.source ? <span className="text-[11px]">{item.source}</span> : null}
        </div>
      </CardContent>
    </Card>
  )
})
