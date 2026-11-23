export type StatusDetailPopupPosition = 'left' | 'center' | 'right'

/** 特色分支独有设置。分组归属：appearance 背景与毛玻璃，feed 瀑布流，features 其余项。 */
export interface CustomAppearanceFields {
  statusDetailPopupEnabled: boolean
  statusDetailPopupPosition: StatusDetailPopupPosition
  statusDetailPopupWidth: number
  backgroundEnabled: boolean
  backgroundColor: string
  backgroundImageUrl: string
  glassOpacity: number
  glassBlur: number
}

export interface CustomFeedFields {
  waterfallColumnCount: number
  waterfallExpandOnWideLayout: boolean
}

export interface CustomFeatureFields {
  xLayoutEnabled: boolean
  browsingHistoryEnabled: boolean
  followGroupsEnabled: boolean
  /** 单栏模式的整页内容宽度。 */
  contentWidth: 'narrower' | 'narrow' | 'standard' | 'wide' | 'wider' | 'custom'
  customContentWidth: number
  /** 是否启用多列工作区；关闭时按单栏布局渲染。 */
  multiColumnEnabled: boolean
  immersiveMode: boolean
  showRightRail: boolean
  showHotSearchCard: boolean
  showFollowedSuperTopicsCard: boolean
}

export type CustomAppSettingsFields = CustomAppearanceFields &
  CustomFeedFields &
  CustomFeatureFields

export const CUSTOM_COLOR_WIDTH_MIN = 800
export const CUSTOM_COLOR_WIDTH_MAX = 2000
export const CUSTOM_COLOR_WIDTH_STEP = 20
export const DEFAULT_CUSTOM_CONTENT_WIDTH = 1200

export const CUSTOM_SETTINGS_DEFAULTS: CustomAppSettingsFields = {
  statusDetailPopupEnabled: true,
  statusDetailPopupPosition: 'right',
  statusDetailPopupWidth: 50,
  backgroundEnabled: true,
  backgroundColor: '#1e40af',
  backgroundImageUrl: 'https://uapis.cn/api/v1/image/bing-daily',
  glassOpacity: 80,
  glassBlur: 12,
  waterfallColumnCount: 1,
  waterfallExpandOnWideLayout: true,
  xLayoutEnabled: true,
  browsingHistoryEnabled: true,
  followGroupsEnabled: true,
  contentWidth: 'standard',
  customContentWidth: DEFAULT_CUSTOM_CONTENT_WIDTH,
  multiColumnEnabled: false,
  immersiveMode: false,
  showRightRail: true,
  showHotSearchCard: true,
  showFollowedSuperTopicsCard: false,
}

function isStatusDetailPopupPosition(value: unknown): value is StatusDetailPopupPosition {
  return value === 'left' || value === 'center' || value === 'right'
}

function isStatusDetailPopupWidth(value: unknown): value is number {
  return typeof value === 'number' && value >= 50 && value <= 80
}

export type CustomContentWidth = CustomFeatureFields['contentWidth']

function isContentWidthCustom(value: unknown): value is CustomContentWidth {
  return (
    value === 'narrower' ||
    value === 'narrow' ||
    value === 'standard' ||
    value === 'wide' ||
    value === 'wider' ||
    value === 'custom'
  )
}

export function normalizeCustomContentWidth(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number.NaN
  if (!Number.isFinite(numeric)) {
    return CUSTOM_SETTINGS_DEFAULTS.customContentWidth
  }

  const clamped = Math.min(CUSTOM_COLOR_WIDTH_MAX, Math.max(CUSTOM_COLOR_WIDTH_MIN, numeric))
  return (
    Math.round((clamped - CUSTOM_COLOR_WIDTH_MIN) / CUSTOM_COLOR_WIDTH_STEP) *
      CUSTOM_COLOR_WIDTH_STEP +
    CUSTOM_COLOR_WIDTH_MIN
  )
}

export function normalizeCustomSettings(
  candidate: Record<string, unknown>,
): CustomAppSettingsFields {
  return {
    statusDetailPopupEnabled:
      typeof candidate.statusDetailPopupEnabled === 'boolean'
        ? candidate.statusDetailPopupEnabled
        : CUSTOM_SETTINGS_DEFAULTS.statusDetailPopupEnabled,
    statusDetailPopupPosition: isStatusDetailPopupPosition(candidate.statusDetailPopupPosition)
      ? candidate.statusDetailPopupPosition
      : CUSTOM_SETTINGS_DEFAULTS.statusDetailPopupPosition,
    statusDetailPopupWidth: isStatusDetailPopupWidth(candidate.statusDetailPopupWidth)
      ? candidate.statusDetailPopupWidth
      : CUSTOM_SETTINGS_DEFAULTS.statusDetailPopupWidth,
    backgroundEnabled:
      typeof candidate.backgroundEnabled === 'boolean'
        ? candidate.backgroundEnabled
        : CUSTOM_SETTINGS_DEFAULTS.backgroundEnabled,
    backgroundColor:
      typeof candidate.backgroundColor === 'string'
        ? candidate.backgroundColor
        : CUSTOM_SETTINGS_DEFAULTS.backgroundColor,
    backgroundImageUrl:
      typeof candidate.backgroundImageUrl === 'string'
        ? candidate.backgroundImageUrl
        : CUSTOM_SETTINGS_DEFAULTS.backgroundImageUrl,
    glassOpacity:
      typeof candidate.glassOpacity === 'number' &&
      candidate.glassOpacity >= 0 &&
      candidate.glassOpacity <= 100
        ? candidate.glassOpacity
        : CUSTOM_SETTINGS_DEFAULTS.glassOpacity,
    glassBlur:
      typeof candidate.glassBlur === 'number' &&
      candidate.glassBlur >= 0 &&
      candidate.glassBlur <= 20
        ? candidate.glassBlur
        : CUSTOM_SETTINGS_DEFAULTS.glassBlur,
    waterfallColumnCount:
      typeof candidate.waterfallColumnCount === 'number' &&
      candidate.waterfallColumnCount >= 1 &&
      candidate.waterfallColumnCount <= 5
        ? candidate.waterfallColumnCount
        : CUSTOM_SETTINGS_DEFAULTS.waterfallColumnCount,
    waterfallExpandOnWideLayout:
      typeof candidate.waterfallExpandOnWideLayout === 'boolean'
        ? candidate.waterfallExpandOnWideLayout
        : CUSTOM_SETTINGS_DEFAULTS.waterfallExpandOnWideLayout,
    xLayoutEnabled:
      typeof candidate.xLayoutEnabled === 'boolean'
        ? candidate.xLayoutEnabled
        : CUSTOM_SETTINGS_DEFAULTS.xLayoutEnabled,
    browsingHistoryEnabled:
      typeof candidate.browsingHistoryEnabled === 'boolean'
        ? candidate.browsingHistoryEnabled
        : CUSTOM_SETTINGS_DEFAULTS.browsingHistoryEnabled,
    followGroupsEnabled:
      typeof candidate.followGroupsEnabled === 'boolean'
        ? candidate.followGroupsEnabled
        : CUSTOM_SETTINGS_DEFAULTS.followGroupsEnabled,
    contentWidth: isContentWidthCustom(candidate.contentWidth)
      ? candidate.contentWidth
      : CUSTOM_SETTINGS_DEFAULTS.contentWidth,
    customContentWidth: normalizeCustomContentWidth(candidate.customContentWidth),
    multiColumnEnabled:
      typeof candidate.multiColumnEnabled === 'boolean'
        ? candidate.multiColumnEnabled
        : CUSTOM_SETTINGS_DEFAULTS.multiColumnEnabled,
    immersiveMode:
      typeof candidate.immersiveMode === 'boolean'
        ? candidate.immersiveMode
        : CUSTOM_SETTINGS_DEFAULTS.immersiveMode,
    showRightRail:
      typeof candidate.showRightRail === 'boolean'
        ? candidate.showRightRail
        : CUSTOM_SETTINGS_DEFAULTS.showRightRail,
    showHotSearchCard:
      typeof candidate.showHotSearchCard === 'boolean'
        ? candidate.showHotSearchCard
        : CUSTOM_SETTINGS_DEFAULTS.showHotSearchCard,
    showFollowedSuperTopicsCard:
      typeof candidate.showFollowedSuperTopicsCard === 'boolean'
        ? candidate.showFollowedSuperTopicsCard
        : CUSTOM_SETTINGS_DEFAULTS.showFollowedSuperTopicsCard,
  }
}
