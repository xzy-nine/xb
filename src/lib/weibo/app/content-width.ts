import type { ContentWidth } from '@/lib/app-settings'

const CONTENT_WIDTH_DELTA_PX: Record<ContentWidth, number> = {
  standard: 0,
  wide: 100,
  wider: 200,
}

export function getContentWidthAdjustedMaxWidth(contentWidth: ContentWidth, baseWidth: number) {
  return `${baseWidth + CONTENT_WIDTH_DELTA_PX[contentWidth]}px`
}
