import { ArrowUp } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { FeedAuthor } from '@/lib/weibo/models/feed'

function getAuthorInitial(name: string | null | undefined) {
  return name?.slice(0, 1).toUpperCase() || '?'
}

interface NewPostsBubbleProps {
  authors: FeedAuthor[]
  count: number
  onClick: () => void
}

export function NewPostsBubble({ authors, count, onClick }: NewPostsBubbleProps) {
  const [visible, setVisible] = useState(true)

  const handleClick = useCallback(() => {
    if (!visible) return
    setVisible(false)
  }, [visible])

  return (
    <AnimatePresence onExitComplete={onClick}>
      {visible ? (
        <motion.button
          key="new-posts-bubble"
          type="button"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.92 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          onClick={handleClick}
          className={cn(
            'bg-foreground text-background',
            'inline-flex items-center gap-2 rounded-full px-4 py-2',
            'shadow-lg shadow-black/20',
            'cursor-pointer border-none',
            'text-sm font-medium',
            'transition-shadow duration-200',
            'hover:shadow-xl hover:shadow-black/30',
            'active:scale-[0.97] active:shadow-md',
          )}
        >
          <span className="flex -space-x-2">
            {authors.slice(0, 5).map((author) => (
              <Avatar key={author.id} className="ring-foreground size-6 ring-2">
                <AvatarImage src={author.avatarUrl ?? undefined} alt={author.name} />
                <AvatarFallback className="text-[10px]">
                  {getAuthorInitial(author.name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </span>
          <span>{count < 10 ? `${count}条新微博` : `10+条新微博`}</span>
          <ArrowUp className="size-4" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  )
}
