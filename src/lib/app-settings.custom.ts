export type StatusDetailPopupPosition = 'left' | 'center' | 'right'

export interface CustomAppSettingsFields {
  statusDetailPopupEnabled: boolean
  statusDetailPopupPosition: StatusDetailPopupPosition
  statusDetailPopupWidth: number
  backgroundEnabled: boolean
  backgroundColor: string
  backgroundImageUrl: string
  glassOpacity: number
  glassBlur: number
  xLayoutEnabled: boolean
  waterfallColumnCount: number
  browsingHistoryEnabled: boolean
  followGroupsEnabled: boolean
}

export const CUSTOM_SETTINGS_DEFAULTS: CustomAppSettingsFields = {
  statusDetailPopupEnabled: true,
  statusDetailPopupPosition: 'right',
  statusDetailPopupWidth: 50,
  backgroundEnabled: true,
  backgroundColor: '#1e40af',
  backgroundImageUrl: 'https://uapis.cn/api/v1/image/bing-daily',
  glassOpacity: 80,
  glassBlur: 12,
  xLayoutEnabled: true,
  waterfallColumnCount: 1,
  browsingHistoryEnabled: true,
  followGroupsEnabled: true,
}

function isStatusDetailPopupPosition(value: unknown): value is StatusDetailPopupPosition {
  return value === 'left' || value === 'center' || value === 'right'
}

function isStatusDetailPopupWidth(value: unknown): value is number {
  return typeof value === 'number' && value >= 50 && value <= 80
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
    xLayoutEnabled:
      typeof candidate.xLayoutEnabled === 'boolean'
        ? candidate.xLayoutEnabled
        : CUSTOM_SETTINGS_DEFAULTS.xLayoutEnabled,
    waterfallColumnCount:
      typeof candidate.waterfallColumnCount === 'number' &&
      candidate.waterfallColumnCount >= 1 &&
      candidate.waterfallColumnCount <= 5
        ? candidate.waterfallColumnCount
        : CUSTOM_SETTINGS_DEFAULTS.waterfallColumnCount,
    browsingHistoryEnabled:
      typeof candidate.browsingHistoryEnabled === 'boolean'
        ? candidate.browsingHistoryEnabled
        : CUSTOM_SETTINGS_DEFAULTS.browsingHistoryEnabled,
    followGroupsEnabled:
      typeof candidate.followGroupsEnabled === 'boolean'
        ? candidate.followGroupsEnabled
        : CUSTOM_SETTINGS_DEFAULTS.followGroupsEnabled,
  }
}
