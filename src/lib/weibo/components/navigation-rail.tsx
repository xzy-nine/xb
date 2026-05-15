import { useMediaQuery } from '@reactuses/core'
import {
  ArrowUpRightIcon,
  Bell,
  Bookmark,
  Compass,
  House,
  MailIcon,
  Pencil,
  Settings,
  UserRound,
  ZapOff,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'

import WeiboLogo from '@/assets/icons/weibo.svg'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { AppTheme } from '@/lib/app-settings'
import { cn } from '@/lib/utils'
import { ThemeModeToggle } from '@/lib/weibo/components/theme-mode-toggle'
import { getCurrentUserUid } from '@/lib/weibo/platform/current-user'
import type { WeiboPageDescriptor } from '@/lib/weibo/route/page-descriptor'

function NavButton({
  children,
  label,
  showLabel,
  isActive,
  onClick,
  href,
  isExternal,
  variant,
}: {
  children: React.ReactNode
  label: React.ReactNode
  showLabel: boolean
  isActive?: boolean
  onClick?: () => void
  href?: string
  isExternal?: boolean
  variant?: React.ComponentProps<typeof Button>['variant']
}) {
  const buttonVariant = variant ?? (isActive ? 'secondary' : 'ghost')
  const button = href ? (
    <Button
      asChild
      className={cn(
        'flex items-center gap-2 transition-transform duration-200 active:scale-[0.96]',
        showLabel ? 'justify-start' : 'justify-center',
      )}
      variant={buttonVariant}
      onClick={onClick}
      size={showLabel ? 'default' : 'icon'}
    >
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        aria-label={showLabel ? undefined : String(label)}
        aria-current={isActive ? 'page' : undefined}
      >
        {children}
        {showLabel && <span>{label}</span>}
      </a>
    </Button>
  ) : (
    <Button
      variant={buttonVariant}
      aria-label={showLabel ? undefined : String(label)}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'w-full items-center gap-2 transition-transform duration-200 active:scale-[0.96]',
        showLabel ? 'justify-start' : 'justify-center',
      )}
      onClick={onClick}
      size={showLabel ? 'default' : 'icon'}
    >
      {children}
      {showLabel && <span>{label}</span>}
    </Button>
  )

  return showLabel ? (
    button
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

interface NavigationRailProps {
  pageKind: WeiboPageDescriptor['kind']
  viewingProfileUserId?: string | null
  rewriteEnabled: boolean
  theme: AppTheme
  onRewriteEnabledChange: (enabled: boolean) => void
  onThemeChange: (theme: AppTheme) => void
  onSettingsOpen: () => void
  onComposeOpen: () => void
}

export function NavigationRail({
  pageKind,
  viewingProfileUserId,
  rewriteEnabled,
  theme,
  onRewriteEnabledChange,
  onThemeChange,
  onSettingsOpen,
  onComposeOpen,
}: NavigationRailProps) {
  const currentUserUid = useMemo(() => getCurrentUserUid(), [])
  const navigate = useNavigate()
  const isXl = useMediaQuery('(min-width: 1280px)')

  const profileHref = useMemo(
    () => (currentUserUid ? `/u/${currentUserUid}` : '/'),
    [currentUserUid],
  )
  const favoritesHref = useMemo(
    () => (currentUserUid ? `/u/page/fav/${currentUserUid}` : '/'),
    [currentUserUid],
  )
  const isOwnProfileActive =
    pageKind === 'profile' &&
    Boolean(currentUserUid) &&
    Boolean(viewingProfileUserId) &&
    currentUserUid === viewingProfileUserId
  const isFavoritesActive = pageKind === 'favorites'

  return (
    <TooltipProvider>
      <aside className="border-border/40 flex h-full min-h-0 flex-col border-r px-1 py-3 md:px-2 md:py-4 xl:px-3 xl:py-5">
        <div className="mb-5 flex justify-start md:mb-6 xl:mb-7">
          <img
            src={WeiboLogo}
            alt="微博 Logo"
            className="h-8 w-8 translate-y-[1px] fill-current object-contain opacity-80 transition-opacity duration-200 hover:opacity-100"
          />
        </div>

        <nav aria-label="主导航" className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-1">
            <NavButton
              label="主页"
              showLabel={isXl}
              isActive={!isOwnProfileActive && pageKind === 'home'}
              onClick={() => navigate('/')}
            >
              <House aria-hidden="true" className="size-4 shrink-0" />
            </NavButton>

            <NavButton
              label="探索"
              showLabel={isXl}
              isActive={pageKind === 'explore'}
              onClick={() => navigate('/hot/weibo/102803')}
            >
              <Compass aria-hidden="true" className="size-4 shrink-0" />
            </NavButton>

            <NavButton
              label="收藏"
              showLabel={isXl}
              isActive={isFavoritesActive}
              onClick={() => navigate(favoritesHref)}
            >
              <Bookmark aria-hidden="true" className="size-4 shrink-0" />
            </NavButton>

            <NavButton
              label="通知"
              showLabel={isXl}
              isActive={pageKind === 'notifications'}
              onClick={() => navigate('/at/weibo')}
            >
              <Bell aria-hidden="true" className="size-4 shrink-0" />
            </NavButton>

            <NavButton
              label={
                <span className="flex items-center gap-1">
                  私信
                  <ArrowUpRightIcon className="size-3" />
                </span>
              }
              showLabel={isXl}
              href="https://api.weibo.com/chat"
              isExternal
            >
              <MailIcon aria-hidden="true" className="size-4 shrink-0" />
            </NavButton>

            <NavButton
              label="我的"
              showLabel={isXl}
              isActive={isOwnProfileActive}
              onClick={() => navigate(profileHref)}
            >
              <UserRound aria-hidden="true" className="size-4 shrink-0" />
            </NavButton>

            <NavButton label="发微博" showLabel={isXl} onClick={onComposeOpen} variant="default">
              <Pencil aria-hidden="true" className="size-4 shrink-0" />
            </NavButton>
          </div>

          <div className="border-border/40 mt-auto space-y-3 border-t pt-3 xl:w-[180px] xl:space-y-3.5 xl:pt-4">
            <div className="flex items-center justify-center xl:justify-between">
              <p className="text-muted-foreground hidden text-xs font-medium xl:block">设置</p>
              {isXl ? (
                <Button type="button" size="icon" variant="secondary" onClick={onSettingsOpen}>
                  <Settings className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" size="icon" variant="secondary" onClick={onSettingsOpen}>
                      <Settings className="size-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">设置</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex items-center justify-center xl:justify-between">
              <p className="text-muted-foreground hidden text-xs font-medium xl:block">
                返回原模式
              </p>
              {isXl ? (
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => onRewriteEnabledChange(!rewriteEnabled)}
                  aria-pressed={rewriteEnabled}
                  aria-label="切换 xb 重写"
                >
                  <ZapOff className="size-4" aria-hidden="true" />
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      onClick={() => onRewriteEnabledChange(!rewriteEnabled)}
                      aria-pressed={rewriteEnabled}
                      aria-label="切换 xb 重写"
                    >
                      <ZapOff className="size-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">返回原模式</TooltipContent>
                </Tooltip>
              )}
            </div>

            <div className="flex items-center justify-center xl:justify-between">
              <p className="text-muted-foreground hidden text-xs font-medium xl:block">深色模式</p>
              {isXl ? (
                <ThemeModeToggle value={theme} onChange={onThemeChange} />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ThemeModeToggle value={theme} onChange={onThemeChange} />
                  </TooltipTrigger>
                  <TooltipContent side="right">深色模式</TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </TooltipProvider>
  )
}
