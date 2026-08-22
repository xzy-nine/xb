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

  // When we have an onNavigate handler and mode is modal, render as a non-anchor
  // element to prevent host page JavaScript from intercepting the click
  const isCustomNavigationOnly = mode === 'modal' && Boolean(onNavigate)

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
    // Resolve relative paths against the current origin while keeping
    // absolute URLs (e.g. external links) untouched.
    const resolved = new URL(url, window.location.origin).href
    window.open(resolved, '_blank', 'noopener,noreferrer')
  }, [])

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Always stop propagation to prevent host page JavaScript (e.g. weibo.com)
    // from intercepting clicks on links inside the shadow root UI
    event.stopPropagation()

    // Call onClick first - if it calls preventDefault, we should not navigate
    if (onClick) {
      onClick(event)
      if (event.defaultPrevented) {
        return
      }
    }

    // Check if this is a new tab navigation (modifier keys or forced new tab mode)
    // This takes precedence over modal mode - user explicitly wants new tab
    if (shouldOpenInNewTab(event)) {
      event.preventDefault()
      openInNewTab(resolvedHref)
      return
    }

    // For custom navigation only mode (modal), prevent default and trigger custom nav
    if (isCustomNavigationOnly) {
      event.preventDefault()
      onNavigate?.(event)
      return
    }

    // For non-modal modes with onNavigate (e.g. cleanup like closing dropdown),
    // call onNavigate but let browser handle navigation normally via href
    if (onNavigate) {
      onNavigate(event)
      // Don't prevent default - let browser navigate normally
      return
    }

    // Default: let browser handle navigation via href (no preventDefault)
  }

  const handleAuxClick = (event: MouseEvent<HTMLAnchorElement>) => {
    // Always stop propagation to prevent host page JavaScript from intercepting
    event.stopPropagation()

    // Call onAuxClick first - if it calls preventDefault, we should not navigate
    if (onAuxClick) {
      onAuxClick(event)
      if (event.defaultPrevented) {
        return
      }
    }

    // Middle click: always open in new tab (standard browser behavior)
    // This takes precedence over modal mode
    if (event.button === 1) {
      event.preventDefault()
      openInNewTab(resolvedHref)
      return
    }

    // For custom navigation only mode, prevent other aux clicks
    if (isCustomNavigationOnly) {
      event.preventDefault()
      return
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      // Always stop propagation to prevent host page JavaScript from intercepting
      event.stopPropagation()

      if (isCustomNavigationOnly) {
        event.preventDefault()
        onNavigate?.()
        if (onKeyDown) onKeyDown(event)
        return
      }

      if (onNavigate) {
        onNavigate()
        if (onKeyDown) onKeyDown(event)
        return
      }
    }

    if (onKeyDown) onKeyDown(event)
  }

  // When in custom navigation only mode, render as a span with role=link
  // to prevent host page JS from treating it as an anchor
  if (isCustomNavigationOnly) {
    return (
      <span
        role="link"
        tabIndex={tabIndex ?? 0}
        className={cn('cursor-pointer', className)}
        onClick={handleClick}
        onAuxClick={handleAuxClick}
        onKeyDown={handleKeyDown}
        aria-label={rest['aria-label']}
        aria-current={rest['aria-current']}
        data-smart-link="modal"
        {...rest}
      >
        {children}
      </span>
    )
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
