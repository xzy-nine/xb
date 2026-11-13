import { type RefObject, useLayoutEffect, useRef } from 'react'

import { getUiPortalContainer } from '@/components/ui/portal'

const INLINE_FULLSCREEN_CLASS_NAME = 'media-inline-fullscreen'

/**
 * 网页全屏：把播放器容器搬到 UI portal 容器（#xb-portal-root）里，躲开信息流里
 * 祖先节点的 overflow / transform / 层叠上下文。
 *
 * 注意：目标容器必须位于 React 根容器内（见 components/ui/portal-mount.tsx），
 * 否则 React 19 挂在根容器上的事件委托收不到这里的事件，控制栏按钮会变成
 * 「有 CSS 动效但不响应」。
 */

interface InlineFullscreenSession {
  deactivate: () => void
}

export function activateInlineFullscreen(
  fullscreenElement: HTMLElement,
  onExit: () => void,
): InlineFullscreenSession {
  const originalParent = fullscreenElement.parentNode
  const originalNextSibling = fullscreenElement.nextSibling
  const placeholder = document.createComment('xb-inline-fullscreen-placeholder')
  const portalContainer = getUiPortalContainer()

  let restored = false

  if (
    originalParent &&
    portalContainer &&
    portalContainer !== originalParent &&
    !fullscreenElement.contains(portalContainer)
  ) {
    originalParent.insertBefore(placeholder, originalNextSibling)
    portalContainer.appendChild(fullscreenElement)
  }

  fullscreenElement.classList.add(INLINE_FULLSCREEN_CLASS_NAME)
  fullscreenElement.setAttribute('data-xb-inline-fullscreen', 'true')

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onExit()
    }
  }

  window.addEventListener('keydown', handleKeyDown)

  return {
    deactivate() {
      if (restored) {
        return
      }

      restored = true
      window.removeEventListener('keydown', handleKeyDown)
      fullscreenElement.classList.remove(INLINE_FULLSCREEN_CLASS_NAME)
      fullscreenElement.removeAttribute('data-xb-inline-fullscreen')

      if (!originalParent) {
        placeholder.remove()
        return
      }

      if (placeholder.parentNode === originalParent) {
        originalParent.insertBefore(fullscreenElement, placeholder)
        placeholder.remove()
        return
      }

      if (originalNextSibling?.parentNode === originalParent) {
        originalParent.insertBefore(fullscreenElement, originalNextSibling)
        return
      }

      if (fullscreenElement.parentNode !== originalParent) {
        originalParent.appendChild(fullscreenElement)
      }
    },
  }
}

export function useInlineFullscreen(
  mediaRef: RefObject<Element | null>,
  active: boolean,
  onExit: () => void,
) {
  const onExitRef = useRef(onExit)

  useLayoutEffect(() => {
    onExitRef.current = onExit
  }, [onExit])

  useLayoutEffect(() => {
    if (!active) {
      return
    }

    const container = mediaRef.current?.closest<HTMLElement>('.media-default-skin--video')
    if (!container) {
      return
    }

    const session = activateInlineFullscreen(container, () => onExitRef.current())
    return () => session.deactivate()
  }, [active, mediaRef])
}
