import { PopoverCSSVars } from '@videojs/core'
import type { PositioningCSSVars, PositioningOptions } from '@videojs/core/dom'
import { getElementSize, resolveCSSLength, supportsAnchorPositioning } from '@videojs/utils/dom'

/**
 * videojs 10.3 收紧了 @videojs/core/dom 的导出面，以下定位辅助函数不再对外暴露，
 * 但媒体弹层仍需要它们。这里按其原实现补一份本地副本，待上游恢复导出后移除。
 */

export interface ManualOffsets {
  sideOffset: number
  alignOffset: number
  boundaryOffset?: number
}

const ZERO_OFFSETS: ManualOffsets = { sideOffset: 0, alignOffset: 0, boundaryOffset: 0 }

type PopoverSide = 'top' | 'bottom' | 'left' | 'right'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatPixels(value: number) {
  return `${clamp(value, 0, Number.POSITIVE_INFINITY)}px`
}

function shiftCrossAxis(value: number, boundaryStart: number, boundaryEnd: number, size: number) {
  const max = boundaryEnd - size
  return max < boundaryStart ? boundaryStart : clamp(value, boundaryStart, max)
}

function createDOMRect(x: number, y: number, width: number, height: number): DOMRect {
  if (typeof DOMRect === 'function') {
    return new DOMRect(x, y, width, height)
  }
  const rect = {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON() {
      return rect
    },
  }
  return rect as DOMRect
}

/** 按布局盒尺寸测量弹层，避免开合动画的 transform 干扰定位。 */
export function getPopupPositionRect(el: HTMLElement, side: PopoverSide): DOMRect {
  const rect = el.getBoundingClientRect()
  const size = getElementSize(el, {
    box: 'layout',
    overflow: side === 'left' || side === 'right' ? 'width' : 'height',
  })
  return createDOMRect(rect.left, rect.top, size.width, size.height)
}

/** 从弹层计算样式读取偏移 CSS 变量。 */
export function resolveOffsets(
  el: Element,
  cssVars: PositioningCSSVars = PopoverCSSVars,
): ManualOffsets {
  const computed = getComputedStyle(el)
  return {
    sideOffset: resolveCSSLength(el, computed.getPropertyValue(cssVars.sideOffset)),
    alignOffset: resolveCSSLength(el, computed.getPropertyValue(cssVars.alignOffset)),
    boundaryOffset: resolveCSSLength(el, computed.getPropertyValue(cssVars.boundaryOffset)),
  }
}

/** 在不支持 CSS 锚点定位时计算内联 top/left。 */
export function getManualPositionStyle(
  triggerRect: DOMRect,
  popupRect: DOMRect,
  opts: PositioningOptions,
  offsets: ManualOffsets = { sideOffset: 0, alignOffset: 0 },
  boundaryRect?: DOMRect,
) {
  const { side, align } = opts
  const { sideOffset, alignOffset } = offsets
  let top = 0
  let bottom: string | undefined
  let left = 0
  let right: string | undefined

  if (side === 'top') bottom = `calc(100% - ${triggerRect.top}px + ${sideOffset}px)`
  else if (side === 'bottom') top = triggerRect.bottom + sideOffset
  else if (side === 'left') right = `calc(100% - ${triggerRect.left}px + ${sideOffset}px)`
  else left = triggerRect.right + sideOffset

  if (side === 'top' || side === 'bottom') {
    if (align === 'start') left = triggerRect.left + alignOffset
    else if (align === 'end') left = triggerRect.right - popupRect.width + alignOffset
    else left = triggerRect.left + (triggerRect.width - popupRect.width) / 2 + alignOffset
  } else if (align === 'start') top = triggerRect.top + alignOffset
  else if (align === 'end') top = triggerRect.bottom - popupRect.height + alignOffset
  else top = triggerRect.top + (triggerRect.height - popupRect.height) / 2 + alignOffset

  if (boundaryRect) {
    const boundaryOffset = offsets.boundaryOffset ?? 0
    if (side === 'top' || side === 'bottom') {
      left = shiftCrossAxis(
        left,
        boundaryRect.left + boundaryOffset,
        boundaryRect.right - boundaryOffset,
        popupRect.width,
      )
    } else {
      top = shiftCrossAxis(
        top,
        boundaryRect.top + boundaryOffset,
        boundaryRect.bottom - boundaryOffset,
        popupRect.height,
      )
    }
  }

  return {
    top: side === 'top' ? 'auto' : `${top}px`,
    bottom: bottom ?? 'auto',
    left: side === 'left' ? 'auto' : `${left}px`,
    right: right ?? 'auto',
  }
}

/** 计算锚点/边界约束的尺寸 CSS 变量。 */
export function getPositioningCSSVars(
  triggerRect: DOMRect,
  boundaryRect: DOMRect,
  opts: PositioningOptions,
  offsets: ManualOffsets = ZERO_OFFSETS,
  cssVars: PositioningCSSVars = PopoverCSSVars,
) {
  const vars: Record<string, string> = {}
  const { side } = opts
  const boundaryOffset = offsets.boundaryOffset ?? 0
  const boundaryStartX = boundaryRect.left + boundaryOffset
  const boundaryEndX = boundaryRect.right - boundaryOffset
  const boundaryStartY = boundaryRect.top + boundaryOffset
  const boundaryEndY = boundaryRect.bottom - boundaryOffset

  vars[cssVars.anchorWidth] = `${triggerRect.width}px`
  vars[cssVars.anchorHeight] = `${triggerRect.height}px`

  if (side === 'top' || side === 'bottom') {
    const sideSpace =
      side === 'top' ? triggerRect.top - boundaryStartY : boundaryEndY - triggerRect.bottom
    vars[cssVars.availableHeight] = formatPixels(sideSpace - offsets.sideOffset)
    vars[cssVars.availableWidth] = formatPixels(boundaryEndX - boundaryStartX)
  } else {
    const sideSpace =
      side === 'left' ? triggerRect.left - boundaryStartX : boundaryEndX - triggerRect.right
    vars[cssVars.availableWidth] = formatPixels(sideSpace - offsets.sideOffset)
    vars[cssVars.availableHeight] = formatPixels(boundaryEndY - boundaryStartY)
  }

  return vars
}

/** 依据边界空间判定弹层应落在哪一侧。 */
export function getPositionedSide(
  triggerRect: DOMRect,
  popupRect: DOMRect,
  boundaryRect: DOMRect,
  opts: PositioningOptions,
  offsets: ManualOffsets = ZERO_OFFSETS,
): PopoverSide {
  const boundaryOffset = offsets.boundaryOffset ?? 0
  const space = {
    top: triggerRect.top - boundaryRect.top - boundaryOffset - offsets.sideOffset,
    bottom: boundaryRect.bottom - triggerRect.bottom - boundaryOffset - offsets.sideOffset,
    left: triggerRect.left - boundaryRect.left - boundaryOffset - offsets.sideOffset,
    right: boundaryRect.right - triggerRect.right - boundaryOffset - offsets.sideOffset,
  }
  const required =
    opts.side === 'left' || opts.side === 'right' ? popupRect.width : popupRect.height
  const opposite: Record<PopoverSide, PopoverSide> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  }

  if (space[opts.side] >= required) return opts.side
  const flipped = opposite[opts.side]
  if (space[flipped] > space[opts.side]) return flipped
  return opts.side
}

export { supportsAnchorPositioning }
