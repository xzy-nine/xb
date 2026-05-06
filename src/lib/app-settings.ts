export type AppTheme = 'system' | 'light' | 'dark'

export type FontFamilyClass = 'font-sans' | 'font-serif'

export type HotSearchType = 'hot' | 'mine' | 'entertainment' | 'life' | 'social'

export type FontSizeClass =
  | 'text-xs'
  | 'text-sm'
  | 'text-base'
  | 'text-lg'
  | 'text-xl'
  | 'text-2xl'
  | 'text-3xl'
  | 'text-4xl'

export type FontWeightClass =
  | 'font-thin'
  | 'font-extralight'
  | 'font-light'
  | 'font-normal'
  | 'font-medium'
  | 'font-semibold'
  | 'font-bold'
  | 'font-extrabold'
  | 'font-black'

export type LetterSpacingClass =
  | 'tracking-tighter'
  | 'tracking-tight'
  | 'tracking-normal'
  | 'tracking-wide'
  | 'tracking-wider'
  | 'tracking-widest'

export type LineHeightClass =
  | 'leading-none'
  | 'leading-tight'
  | 'leading-snug'
  | 'leading-normal'
  | 'leading-relaxed'
  | 'leading-loose'

export interface AppSettings {
  theme: AppTheme
  rewriteEnabled: boolean
  fontSizeClass: FontSizeClass
  fontWeightClass: FontWeightClass
  letterSpacingClass: LetterSpacingClass
  lineHeightClass: LineHeightClass
  fontFamilyClass: FontFamilyClass
  showHotSearchCard: boolean
  collapseRepliesEnabled: boolean
  darkModeImageDim: boolean
  imageGenEnabled: boolean
  imageGenShowDataArea: boolean
  imageGenShowFullImages: boolean
  imageGenShowWeiboLink: boolean
  imageGenTheme: GenImageCardTheme
  imageGenCardStyle: CardStyle
  hotSearchType: HotSearchType
}

export type GenImageCardTheme = 'light' | 'dark'

export type CardStyle =
  | 'default'
  | 'minimal'
  | 'glass'
  | 'bold'
  | 'contrast'
  | 'vogue'
  | 'soft'
  | 'sticker'
  | 'comic'

export interface AppSettingsStorageArea {
  get: (keys?: string | string[] | Record<string, unknown>) => Promise<Record<string, unknown>>
  set: (items: Record<string, unknown>) => Promise<void>
}

export const APP_SETTINGS_STORAGE_KEY = 'xb:app-settings'

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'system',
  rewriteEnabled: true,
  fontSizeClass: 'text-base',
  fontWeightClass: 'font-normal',
  letterSpacingClass: 'tracking-normal',
  lineHeightClass: 'leading-relaxed',
  fontFamilyClass: 'font-sans',
  showHotSearchCard: true,
  collapseRepliesEnabled: false,
  darkModeImageDim: false,
  imageGenEnabled: true,
  imageGenShowDataArea: true,
  imageGenShowFullImages: false,
  imageGenShowWeiboLink: false,
  imageGenTheme: 'light' as GenImageCardTheme,
  imageGenCardStyle: 'default' as CardStyle,
  hotSearchType: 'hot' as HotSearchType,
}

function isAppTheme(value: unknown): value is AppTheme {
  return value === 'system' || value === 'light' || value === 'dark'
}

function isFontFamilyClass(value: unknown): value is FontFamilyClass {
  return value === 'font-sans' || value === 'font-serif'
}

function isHotSearchType(value: unknown): value is HotSearchType {
  return (
    value === 'hot' ||
    value === 'mine' ||
    value === 'entertainment' ||
    value === 'life' ||
    value === 'social'
  )
}

function isFontSizeClass(value: unknown): value is FontSizeClass {
  return (
    value === 'text-xs' ||
    value === 'text-sm' ||
    value === 'text-base' ||
    value === 'text-lg' ||
    value === 'text-xl' ||
    value === 'text-2xl' ||
    value === 'text-3xl' ||
    value === 'text-4xl'
  )
}

function isFontWeightClass(value: unknown): value is FontWeightClass {
  return (
    value === 'font-thin' ||
    value === 'font-extralight' ||
    value === 'font-light' ||
    value === 'font-normal' ||
    value === 'font-medium' ||
    value === 'font-semibold' ||
    value === 'font-bold' ||
    value === 'font-extrabold' ||
    value === 'font-black'
  )
}

function isLetterSpacingClass(value: unknown): value is LetterSpacingClass {
  return (
    value === 'tracking-tighter' ||
    value === 'tracking-tight' ||
    value === 'tracking-normal' ||
    value === 'tracking-wide' ||
    value === 'tracking-wider' ||
    value === 'tracking-widest'
  )
}

function isLineHeightClass(value: unknown): value is LineHeightClass {
  return (
    value === 'leading-none' ||
    value === 'leading-tight' ||
    value === 'leading-snug' ||
    value === 'leading-normal' ||
    value === 'leading-relaxed' ||
    value === 'leading-loose'
  )
}

export function normalizeAppSettings(value: unknown): AppSettings {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_APP_SETTINGS }
  }

  const candidate = value as Partial<AppSettings>

  return {
    theme: isAppTheme(candidate.theme) ? candidate.theme : DEFAULT_APP_SETTINGS.theme,
    rewriteEnabled:
      typeof candidate.rewriteEnabled === 'boolean'
        ? candidate.rewriteEnabled
        : DEFAULT_APP_SETTINGS.rewriteEnabled,
    fontSizeClass: isFontSizeClass(candidate.fontSizeClass)
      ? candidate.fontSizeClass
      : DEFAULT_APP_SETTINGS.fontSizeClass,
    fontWeightClass: isFontWeightClass(candidate.fontWeightClass)
      ? candidate.fontWeightClass
      : DEFAULT_APP_SETTINGS.fontWeightClass,
    letterSpacingClass: isLetterSpacingClass(candidate.letterSpacingClass)
      ? candidate.letterSpacingClass
      : DEFAULT_APP_SETTINGS.letterSpacingClass,
    lineHeightClass: isLineHeightClass(candidate.lineHeightClass)
      ? candidate.lineHeightClass
      : DEFAULT_APP_SETTINGS.lineHeightClass,
    fontFamilyClass: isFontFamilyClass(candidate.fontFamilyClass)
      ? candidate.fontFamilyClass
      : DEFAULT_APP_SETTINGS.fontFamilyClass,
    showHotSearchCard:
      typeof candidate.showHotSearchCard === 'boolean'
        ? candidate.showHotSearchCard
        : DEFAULT_APP_SETTINGS.showHotSearchCard,
    collapseRepliesEnabled:
      typeof candidate.collapseRepliesEnabled === 'boolean'
        ? candidate.collapseRepliesEnabled
        : DEFAULT_APP_SETTINGS.collapseRepliesEnabled,
    darkModeImageDim:
      typeof candidate.darkModeImageDim === 'boolean'
        ? candidate.darkModeImageDim
        : DEFAULT_APP_SETTINGS.darkModeImageDim,
    imageGenEnabled:
      typeof candidate.imageGenEnabled === 'boolean'
        ? candidate.imageGenEnabled
        : DEFAULT_APP_SETTINGS.imageGenEnabled,
    imageGenShowDataArea:
      typeof candidate.imageGenShowDataArea === 'boolean'
        ? candidate.imageGenShowDataArea
        : DEFAULT_APP_SETTINGS.imageGenShowDataArea,
    imageGenShowFullImages:
      typeof candidate.imageGenShowFullImages === 'boolean'
        ? candidate.imageGenShowFullImages
        : DEFAULT_APP_SETTINGS.imageGenShowFullImages,
    imageGenShowWeiboLink:
      typeof candidate.imageGenShowWeiboLink === 'boolean'
        ? candidate.imageGenShowWeiboLink
        : DEFAULT_APP_SETTINGS.imageGenShowWeiboLink,
    imageGenTheme:
      candidate.imageGenTheme === 'light' || candidate.imageGenTheme === 'dark'
        ? candidate.imageGenTheme
        : DEFAULT_APP_SETTINGS.imageGenTheme,
    imageGenCardStyle:
      typeof candidate.imageGenCardStyle === 'string'
        ? candidate.imageGenCardStyle
        : DEFAULT_APP_SETTINGS.imageGenCardStyle,
    hotSearchType: isHotSearchType(candidate.hotSearchType)
      ? candidate.hotSearchType
      : DEFAULT_APP_SETTINGS.hotSearchType,
  }
}

export function resolveIsDarkMode(theme: AppTheme, prefersDark: boolean): boolean {
  if (theme === 'dark') {
    return true
  }

  if (theme === 'light') {
    return false
  }

  return prefersDark
}

export async function loadAppSettings(
  storageArea: AppSettingsStorageArea = browser.storage.local,
): Promise<AppSettings> {
  const stored = await storageArea.get(APP_SETTINGS_STORAGE_KEY)
  return normalizeAppSettings(stored[APP_SETTINGS_STORAGE_KEY])
}

export async function persistAppSettings(
  nextValue: AppSettings,
  storageArea: AppSettingsStorageArea = browser.storage.local,
): Promise<AppSettings> {
  const normalized = normalizeAppSettings(nextValue)

  await storageArea.set({
    [APP_SETTINGS_STORAGE_KEY]: normalized,
  })

  return normalized
}
