'use client'

import { useLayoutEffect } from 'react'

import { getUiPortalContainer } from './portal'

/**
 * 把 UI portal 容器（#xb-portal-root）挂进 React 根容器。
 *
 * 约束一：必须在根容器**内部**。
 * React 19 的事件委托监听只挂在根容器上。网页全屏（inline fullscreen）会把播放器
 * 的 DOM 节点直接搬进 portal 容器，只有当 portal 容器仍在根容器内时，被搬走的节点
 * 才能继续冒泡到 React 的委托监听；否则播放器内的按钮只有 CSS :hover/:active 动效，
 * onClick / onPointerDown 等合成事件全部不触发。
 *
 * 约束二：必须在 React 挂载**之后**插入。
 * React 19 首次提交会清空根容器的子节点，在 createRoot 之前 append 会被抹掉，所以
 * 这里放进 React 树，用 layout effect 挂载（清空发生在 before-mutation 阶段之前）。
 */
export function UiPortalMount({ container }: { container: HTMLElement }) {
  useLayoutEffect(() => {
    const portalContainer = getUiPortalContainer()
    if (!portalContainer || portalContainer.parentNode === container) return
    container.appendChild(portalContainer)
  }, [container])

  return null
}
