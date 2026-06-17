import { ExternalLinkIcon, ShieldAlertIcon } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const MWEIBO_HOME_URL = 'https://m.weibo.cn/'

interface MweiboCaptchaPromptProps {
  onRetry: () => void
}

/**
 * Friendly prompt shown when m.weibo.cn gates a request behind its captcha
 * interceptor. Guides the user to complete the captcha at m.weibo.cn and
 * offers a one-click retry once they're done.
 */
export function MweiboCaptchaPrompt({ onRetry }: MweiboCaptchaPromptProps) {
  return (
    <Card className="mx-4 my-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldAlertIcon aria-hidden="true" className="size-4 text-amber-500" />
          需要人机验证
        </CardTitle>
        <CardDescription>
          微博移动端（m.weibo.cn）触发了人机验证，导致话题内容无法加载。请打开下方链接完成验证后再点击「重新加载」。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <a
          href={MWEIBO_HOME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'default', size: 'default' }))}
        >
          <ExternalLinkIcon aria-hidden="true" />
          前往 m.weibo.cn 完成验证
        </a>
        <Button variant="outline" onClick={onRetry}>
          验证后重新加载
        </Button>
      </CardContent>
    </Card>
  )
}
