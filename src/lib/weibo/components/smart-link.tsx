import { useCallback } from 'react'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type SmartLinkMode = 'auto' | 'self' | 'newTab' | 'modal'

export interface SmartLinkProps {
  /** Target URL for navigation */
  href?: string
  /** React Router "to" prop (if using React Router path) */
  to?: string
  /** Navigation mode, overrides automatic detection */
  mode?: SmartLinkMode
  /** External link (always opens in new tab with safe rel) */
  external?: boolean
  /** Custom navigate handler. Takes precedence over default browser navigation for left click. */
  onNavigate?: (event?: MouseEvent<HTMLAnchorElement> | KeyboardEvent<HTMLAnchorElement>) => void
  /** Additional class names */
  className?: string
  /** Children */
  children: ReactNode
  /** Additional props forwarded to the anchor element */
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  onAuxClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLAnchorElement>) => void
  tabIndex?: number
  'aria-label'?: string
  'aria-current'?: 'page' | true | false | 'step' | 'location' | 'date' | 'time' | 'true' | 'false'
  target?: string
  rel?: string
}

export function SmartLink({
  href,
  to,
  mode = 'auto',
  external = false,
  onNavigate,
  className,
  children,
  onClick,
  onAuxClick,
  onKeyDown,
  tabIndex,
  ...rest
}: SmartLinkProps) {
  const resolvedHref = href ?? to ?? '#'

  const shouldOpenInNewTab = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      // Forced new tab mode
      if (mode === 'newTab' || external) return true

      // Auto-detect: modifier keys or middle click
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) {
        return true
      }

      return false
    },
    [mode, external],
  )

  const openInNewTab = useCallback((url: string) => {
    window.open(`${window.location.origin}${url}`, '_blank', 'noopener,noreferrer')
  }, [])

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Call onClick first - if it calls preventDefault, we should not navigate
    if (onClick) {
      onClick(event)
      if (event.defaultPrevented) {
        return
      }
    }

    // Check if this is a new tab navigation (modifier keys or forced new tab mode)
    if (shouldOpenInNewTab(event)) {
      event.preventDefault()
      openInNewTab(resolvedHref)
      return
    }

    // modal mode: trigger custom navigation
    if (mode === 'modal' && onNavigate) {
      event.preventDefault()
      onNavigate(event)
      return
    }

    // For non-modal modes, call onNavigate if provided
    if (onNavigate) {
      event.preventDefault()
      onNavigate(event)
      return
    }

    // Default: let browser handle navigation via href
  }

  const handleAuxClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Call onAuxClick first - if it calls preventDefault, we should not navigate
    if (onAuxClick) {
      onAuxClick(event)
      if (event.defaultPrevented) {
        return
      }
    }

    if (event.button === 1) {
      // Middle click: always open in new tab (standard browser behavior)
      event.preventDefault()
      openInNewTab(resolvedHref)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (mode === 'modal' && onNavigate) {
        event.preventDefault()
        onNavigate()
        if (onKeyDown) onKeyDown(event)
        return
      }

      if (onNavigate) {
        event.preventDefault()
        onNavigate()
        if (onKeyDown) onKeyDown(event)
        return
      }
    }

    if (onKeyDown) onKeyDown(event)
  }

  const resolvedTarget = undefined // We handle new tab opening manually
  const resolvedRel = external ? 'noopener noreferrer' : undefined

  return (
    <a
      href={resolvedHref}
      className={cn('cursor-pointer', className)}
      target={resolvedTarget}
      rel={resolvedRel}
      onClick={handleClick}
      onAuxClick={handleAuxClick}
      onKeyDown={handleKeyDown}
      tabIndex={tabIndex}
      {...rest}
    >
      {children}
    </a>
  )
}
