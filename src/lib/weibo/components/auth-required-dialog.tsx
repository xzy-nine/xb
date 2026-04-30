import { LogIn } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AuthRequiredDialogProps {
  open: boolean
  onLogin: () => void
}

export function AuthRequiredDialog({ open, onLogin }: AuthRequiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent showCloseButton={false} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="size-5" />
            未登录微博
          </DialogTitle>
          <DialogDescription>
            当前未检测到微博登录状态，请先前往微博登录页完成登录，登录后刷新页面即可使用 xb。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onLogin} className="w-full sm:w-auto">
            去登录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
