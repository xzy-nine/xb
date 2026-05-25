import { useStore } from 'zustand'
import { createStore, type StoreApi } from 'zustand/vanilla'

import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  persistAppSettings,
  type AppSettings,
  type AppSettingsStorageArea,
  type AppTheme,
  type BrowsingHistoryLimit,
  type CardStyle,
  type DarkBgColorPreset,
  type FontFamilyClass,
  type FontSizeClass,
  type FontWeightClass,
  type LetterSpacingClass,
  type LineHeightClass,
  type GenImageCardTheme,
  type HomeTab,
  type ContentWidth,
  type HotSearchType,
  type LightBgColorPreset,
  type SelectedThemeType,
  type UserTheme,
} from '@/lib/app-settings'
import { CUSTOM_THEME_PRESETS } from '@/lib/custom-theme'

export interface AppSettingsStoreState extends AppSettings {
  isHydrated: boolean
  hydrate: () => Promise<void>
  setTheme: (theme: AppTheme) => Promise<void>
  setRewriteEnabled: (enabled: boolean) => Promise<void>
  setFontSizeClass: (fontSizeClass: FontSizeClass) => Promise<void>
  setFontWeightClass: (fontWeightClass: FontWeightClass) => Promise<void>
  setLetterSpacingClass: (letterSpacingClass: LetterSpacingClass) => Promise<void>
  setLineHeightClass: (lineHeightClass: LineHeightClass) => Promise<void>
  setFontFamilyClass: (fontFamilyClass: FontFamilyClass) => Promise<void>
  setShowHotSearchCard: (show: boolean) => Promise<void>
  setShowFollowedSuperTopicsCard: (show: boolean) => Promise<void>
  setCollapseRepliesEnabled: (enabled: boolean) => Promise<void>
  setRenderReplyChainEnabled: (enabled: boolean) => Promise<void>
  setDarkModeImageDim: (enabled: boolean) => Promise<void>
  setLightModeBgColor: (color: LightBgColorPreset) => Promise<void>
  setDarkModeBgColor: (color: DarkBgColorPreset) => Promise<void>
  setImageGenEnabled: (enabled: boolean) => Promise<void>
  setImageGenShowDataArea: (show: boolean) => Promise<void>
  setImageGenShowFullImages: (show: boolean) => Promise<void>
  setImageGenShowWeiboLink: (show: boolean) => Promise<void>
  setImageGenTheme: (theme: GenImageCardTheme) => Promise<void>
  setImageGenCardStyle: (style: CardStyle) => Promise<void>
  setHotSearchType: (type: HotSearchType) => Promise<void>
  setXLayoutEnabled: (enabled: boolean) => Promise<void>
  setBrowsingHistoryEnabled: (enabled: boolean) => Promise<void>
  setBrowsingHistoryLimit: (limit: BrowsingHistoryLimit) => Promise<void>
  setFollowGroupsEnabled: (enabled: boolean) => Promise<void>
  setNativeTopicPage: (enabled: boolean) => Promise<void>
  setContentWidth: (width: ContentWidth) => Promise<void>
  homeTab: HomeTab
  setHomeTab: (tab: HomeTab) => Promise<void>
  setCustomThemeLightCss: (css: string) => Promise<void>
  setCustomThemeDarkCss: (css: string) => Promise<void>
  setSelectedThemeType: (type: SelectedThemeType) => Promise<void>
  setSelectedThemeId: (id: string) => Promise<void>
  addUserTheme: (theme: UserTheme) => Promise<void>
  deleteUserTheme: (id: string) => Promise<void>
  updateUserTheme: (
    id: string,
    updates: Partial<Pick<UserTheme, 'lightCss' | 'darkCss' | 'name'>>,
  ) => Promise<void>
}

export type AppSettingsStore = StoreApi<AppSettingsStoreState>

function toPersistedSettings(state: AppSettingsStoreState): AppSettings {
  return {
    contentWidth: state.contentWidth,
    theme: state.theme,
    rewriteEnabled: state.rewriteEnabled,
    fontSizeClass: state.fontSizeClass,
    fontWeightClass: state.fontWeightClass,
    letterSpacingClass: state.letterSpacingClass,
    lineHeightClass: state.lineHeightClass,
    fontFamilyClass: state.fontFamilyClass,
    showHotSearchCard: state.showHotSearchCard,
    showFollowedSuperTopicsCard: state.showFollowedSuperTopicsCard,
    collapseRepliesEnabled: state.collapseRepliesEnabled,
    renderReplyChainEnabled: state.renderReplyChainEnabled,
    darkModeImageDim: state.darkModeImageDim,
    lightModeBgColor: state.lightModeBgColor,
    darkModeBgColor: state.darkModeBgColor,
    imageGenEnabled: state.imageGenEnabled,
    imageGenShowDataArea: state.imageGenShowDataArea,
    imageGenShowFullImages: state.imageGenShowFullImages,
    imageGenShowWeiboLink: state.imageGenShowWeiboLink,
    imageGenTheme: state.imageGenTheme,
    imageGenCardStyle: state.imageGenCardStyle,
    hotSearchType: state.hotSearchType,
    xLayoutEnabled: state.xLayoutEnabled,
    browsingHistoryEnabled: state.browsingHistoryEnabled,
    browsingHistoryLimit: state.browsingHistoryLimit,
    followGroupsEnabled: state.followGroupsEnabled,
    xbTopicPage: state.xbTopicPage,
    homeTab: state.homeTab,
    customThemeLightCss: state.customThemeLightCss,
    customThemeDarkCss: state.customThemeDarkCss,
    selectedThemeType: state.selectedThemeType,
    selectedThemeId: state.selectedThemeId,
    userThemes: state.userThemes,
  }
}

export function createAppSettingsStore(
  storageArea: AppSettingsStorageArea = browser.storage.local,
): AppSettingsStore {
  return createStore<AppSettingsStoreState>((set, get) => {
    async function updateAndPersist(patch: Partial<AppSettings>) {
      set(patch)
      await persistAppSettings(
        {
          ...toPersistedSettings(get()),
          ...patch,
        },
        storageArea,
      )
    }

    return {
      ...DEFAULT_APP_SETTINGS,
      isHydrated: false,
      async hydrate() {
        const settings = await loadAppSettings(storageArea)

        // If a preset is selected but CSS is empty, fill from the preset definition
        if (
          settings.selectedThemeType === 'preset' &&
          !settings.customThemeLightCss.trim() &&
          !settings.customThemeDarkCss.trim()
        ) {
          const preset = CUSTOM_THEME_PRESETS.find((p) => p.key === settings.selectedThemeId)
          if (preset) {
            settings.customThemeLightCss = preset.lightCss
            settings.customThemeDarkCss = preset.darkCss
          }
        }

        set({
          ...settings,
          isHydrated: true,
        })
      },
      async setTheme(theme) {
        await updateAndPersist({ theme })
      },
      async setRewriteEnabled(rewriteEnabled) {
        await updateAndPersist({ rewriteEnabled })
      },
      async setFontSizeClass(fontSizeClass) {
        await updateAndPersist({ fontSizeClass })
      },
      async setFontWeightClass(fontWeightClass) {
        await updateAndPersist({ fontWeightClass })
      },
      async setLetterSpacingClass(letterSpacingClass) {
        await updateAndPersist({ letterSpacingClass })
      },
      async setLineHeightClass(lineHeightClass) {
        await updateAndPersist({ lineHeightClass })
      },
      async setFontFamilyClass(fontFamilyClass) {
        await updateAndPersist({ fontFamilyClass })
      },
      async setShowHotSearchCard(showHotSearchCard) {
        await updateAndPersist({ showHotSearchCard })
      },
      async setShowFollowedSuperTopicsCard(showFollowedSuperTopicsCard) {
        await updateAndPersist({ showFollowedSuperTopicsCard })
      },
      async setCollapseRepliesEnabled(collapseRepliesEnabled) {
        await updateAndPersist({ collapseRepliesEnabled })
      },
      async setRenderReplyChainEnabled(renderReplyChainEnabled) {
        await updateAndPersist({ renderReplyChainEnabled })
      },
      async setDarkModeImageDim(darkModeImageDim) {
        await updateAndPersist({ darkModeImageDim })
      },
      async setLightModeBgColor(lightModeBgColor) {
        await updateAndPersist({ lightModeBgColor })
      },
      async setDarkModeBgColor(darkModeBgColor) {
        await updateAndPersist({ darkModeBgColor })
      },
      async setImageGenEnabled(imageGenEnabled) {
        await updateAndPersist({ imageGenEnabled })
      },
      async setImageGenShowDataArea(imageGenShowDataArea) {
        await updateAndPersist({ imageGenShowDataArea })
      },
      async setImageGenShowFullImages(imageGenShowFullImages) {
        await updateAndPersist({ imageGenShowFullImages })
      },
      async setImageGenShowWeiboLink(imageGenShowWeiboLink) {
        await updateAndPersist({ imageGenShowWeiboLink })
      },
      async setImageGenTheme(imageGenTheme) {
        await updateAndPersist({ imageGenTheme })
      },
      async setImageGenCardStyle(imageGenCardStyle) {
        await updateAndPersist({ imageGenCardStyle })
      },
      async setHotSearchType(hotSearchType) {
        await updateAndPersist({ hotSearchType })
      },
      async setXLayoutEnabled(xLayoutEnabled) {
        await updateAndPersist({ xLayoutEnabled })
      },
      async setBrowsingHistoryEnabled(browsingHistoryEnabled) {
        await updateAndPersist({ browsingHistoryEnabled })
      },
      async setBrowsingHistoryLimit(browsingHistoryLimit) {
        await updateAndPersist({ browsingHistoryLimit })
      },
      async setHomeTab(homeTab) {
        await updateAndPersist({ homeTab })
      },
      async setFollowGroupsEnabled(followGroupsEnabled) {
        await updateAndPersist({ followGroupsEnabled })
      },
      async setNativeTopicPage(xbTopicPage) {
        await updateAndPersist({ xbTopicPage })
      },
      async setContentWidth(contentWidth) {
        await updateAndPersist({ contentWidth })
      },
      async setCustomThemeLightCss(customThemeLightCss) {
        await updateAndPersist({ customThemeLightCss })
      },
      async setCustomThemeDarkCss(customThemeDarkCss) {
        await updateAndPersist({ customThemeDarkCss })
      },
      async setSelectedThemeType(selectedThemeType) {
        await updateAndPersist({ selectedThemeType })
      },
      async setSelectedThemeId(selectedThemeId) {
        await updateAndPersist({ selectedThemeId })
      },
      async addUserTheme(theme) {
        const current = get()
        await updateAndPersist({
          userThemes: [...current.userThemes, theme],
        })
      },
      async deleteUserTheme(id) {
        const current = get()
        await updateAndPersist({
          userThemes: current.userThemes.filter((t) => t.id !== id),
        })
      },
      async updateUserTheme(id, updates) {
        const current = get()
        await updateAndPersist({
          userThemes: current.userThemes.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })
      },
    }
  })
}

let appSettingsStore: AppSettingsStore | null = null

export function getAppSettingsStore(storageArea?: AppSettingsStorageArea): AppSettingsStore {
  if (!appSettingsStore) {
    appSettingsStore = createAppSettingsStore(storageArea)
  }

  return appSettingsStore
}

export function resetAppSettingsStoreForTest() {
  appSettingsStore = null
}

export function useAppSettings<T>(selector: (state: AppSettingsStoreState) => T): T {
  return useStore(getAppSettingsStore(), selector)
}
