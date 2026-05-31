import { Download, Image, Link, MoreHorizontal, Star, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useGenImageDialog } from '@/lib/weibo/components/gen-image-dialog-context'
import type { FeedItem } from '@/lib/weibo/models/feed'
import {
  downloadAsZip,
  estimateTotalSize,
  extractMediaUrls,
} from '@/lib/weibo/utils/download-media'

type ContentType = 'status' | 'comment'

export interface FeedCardMoreMenuProps {
  type: ContentType
  isOwner: boolean
  item?: FeedItem
  favorited?: boolean
  onFavorite?: () => void | Promise<void>
  onDelete: () => void | Promise<void>
  isDeleting?: boolean
  contentLabel?: string
  className?: string
  xLayoutEnabled?: boolean
}

export function FeedCardMoreMenu({
  type,
  isOwner,
  item,
  favorited = false,
  onFavorite,
  onDelete,
  isDeleting,
  contentLabel = '这条内容',
  className,
  xLayoutEnabled = false,
}: FeedCardMoreMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [sizeWarningOpen, setSizeWarningOpen] = useState(false)
  const [pendingDownload, setPendingDownload] = useState<{ urls: any[]; filename: string } | null>(
    null,
  )
  const { openGenImage } = useGenImageDialog()

  const showFavorite = type === 'status' && onFavorite !== undefined && !xLayoutEnabled
  const showGenImage = item && type === 'status'
  const showCopyLink = type === 'status' && !xLayoutEnabled && item?.mblogId
  const showDownload =
    item &&
    type === 'status' &&
    (item.images.length > 0 || item.media !== null || (item.mixMediaInfo?.length ?? 0) > 0)

  const handleDownload = async () => {
    if (!item) return

    setMenuOpen(false)
    setDownloadLoading(true)

    try {
      const urls = extractMediaUrls(item)

      if (urls.length === 0) {
        toast.error('没有可下载的媒体资源')
        return
      }

      // 检查总大小
      const totalSize = await estimateTotalSize(urls)
      const sizeMB = totalSize / (1024 * 1024)

      if (sizeMB > 100) {
        // 超过 100MB，弹窗确认
        const author = item.author.name
        const text = item.text
          .replace(/<[^>]*>/g, '')
          .replace(/[<>:"/\\|?*\n\r]/g, '')
          .slice(0, 10)
        const zipFilename = `${author}_${text}.zip`
        setPendingDownload({ urls, filename: zipFilename })
        setSizeWarningOpen(true)
        return
      }

      // 直接下载
      await performDownload(urls, item)
    } catch (error) {
      console.error('下载失败:', error)
      toast.error('下载失败，请稍后重试')
    } finally {
      setDownloadLoading(false)
    }
  }

  const performDownload = async (urls: any[], feedItem: FeedItem) => {
    const author = feedItem.author.name
    const text = feedItem.text
      .replace(/<[^>]*>/g, '')
      .replace(/[<>:"/\\|?*\n\r]/g, '')
      .slice(0, 10)
    const zipFilename = `${author}_${text}.zip`

    await downloadAsZip(urls, zipFilename)
    toast.success(`已下载 ${urls.length} 个文件`)
  }

  const confirmLargeDownload = async () => {
    if (!pendingDownload || !item) return

    setSizeWarningOpen(false)
    setDownloadLoading(true)

    try {
      await performDownload(pendingDownload.urls, item)
    } catch (error) {
      console.error('下载失败:', error)
      toast.error('下载失败，请稍后重试')
    } finally {
      setDownloadLoading(false)
      setPendingDownload(null)
    }
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('size-8 shrink-0', className)}
            aria-label="更多操作"
            onClick={(event) => event.stopPropagation()}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(event) => event.preventDefault()}
          onClick={(e) => e.stopPropagation()}
        >
          {showGenImage ? (
            <DropdownMenuItem
              onSelect={() => {
                setMenuOpen(false)
                openGenImage(item!)
              }}
            >
              <Image className="mr-2 size-4" />
              生图
            </DropdownMenuItem>
          ) : null}
          {showDownload && (
            <DropdownMenuItem onSelect={handleDownload} disabled={downloadLoading}>
              <Download className="mr-2 size-4" />
              批量下载
            </DropdownMenuItem>
          )}
          {showFavorite && (
            <DropdownMenuItem
              onSelect={() => {
                setMenuOpen(false)
                if (onFavorite) {
                  void (async () => {
                    setFavoriteLoading(true)
                    try {
                      await onFavorite()
                    } finally {
                      setFavoriteLoading(false)
                    }
                  })()
                }
              }}
              disabled={favoriteLoading}
            >
              <Star className="mr-2 size-4" fill={favorited ? 'currentColor' : 'none'} />
              {favorited ? '取消收藏' : '收藏'}
            </DropdownMenuItem>
          )}
          {showCopyLink && (
            <DropdownMenuItem
              onSelect={() => {
                const url = `https://weibo.com/${item!.author.id}/${item!.mblogId}`
                void navigator.clipboard.writeText(url).then(() => {
                  toast.success('已复制链接')
                })
              }}
            >
              <Link className="mr-2 size-4" />
              复制链接
            </DropdownMenuItem>
          )}
          {isOwner && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                setMenuOpen(false)
                setConfirmOpen(true)
              }}
            >
              <Trash className="mr-2 size-4" />
              删除
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>确定要删除{contentLabel}吗？此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                void (async () => {
                  try {
                    await onDelete()
                    setConfirmOpen(false)
                  } catch {
                    // Caller shows toast
                  }
                })()
              }}
            >
              {isDeleting ? '删除中…' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={sizeWarningOpen} onOpenChange={setSizeWarningOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>文件较大</DialogTitle>
            <DialogDescription>
              该微博的媒体文件总大小超过 100MB，下载可能需要较长时间。确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSizeWarningOpen(false)
                setPendingDownload(null)
              }}
            >
              取消
            </Button>
            <Button type="button" onClick={confirmLargeDownload} disabled={downloadLoading}>
              {downloadLoading ? '下载中…' : '继续下载'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
