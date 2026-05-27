import {
  Bookmark,
  Compass,
  History,
  Home,
  MessageSquare,
  Palette,
  PanelRight,
  Pencil,
  Settings,
  Sparkles,
  SunMoon,
  Trash2,
  Type,
  User,
  Bell,
  PanelLeft,
} from 'lucide-react'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'

import darkModeImageDimJpeg from '@/assets/images/dark-mode-image-dim.jpeg'
import collapseReplyChain from '@/assets/images/quotechains-collapsible.jpeg'
import quoteChainsJpeg from '@/assets/images/quotechains.jpeg'
import xLayoutJpeg from '@/assets/images/x-layout.jpeg'
import { TreeView, type TreeDataItem } from '@/components/tree-view'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  VisuallyHidden,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { BROWSING_HISTORY_LIMIT_OPTIONS, DEFAULT_APP_SETTINGS } from '@/lib/app-settings'
import type {
  AppTheme,
  BrowsingHistoryLimit,
  ContentWidth,
  FontFamilyClass,
  FontSizeClass,
  FontWeightClass,
  LetterSpacingClass,
  LineHeightClass,
  UserTheme,
} from '@/lib/app-settings'
import { useAppSettings } from '@/lib/app-settings-store'
import { CUSTOM_THEME_PRESETS } from '@/lib/custom-theme'
import { browsingHistoryStore } from '@/lib/weibo/hooks/use-browsing-history'

import { FontPreviewCard } from './settings-font-preview'

const SIDEBAR_GROUPS = [
  { id: 'appearance' as const, label: '外观', icon: SunMoon },
  { id: 'theme' as const, label: '主题', icon: Palette },
  { id: 'personalize' as const, label: '个性化', icon: Sparkles },
  { id: 'font' as const, label: '字体', icon: Type },
  { id: 'advanced' as const, label: '高级', icon: Settings },
]

type GroupId = (typeof SIDEBAR_GROUPS)[number]['id']

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:bg-accent/50 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors data-[active=true]:font-medium"
      data-active={active || undefined}
    >
      <Icon size={16} strokeWidth={1.5} />
      {label}
    </button>
  )
}

function Field({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-[11px] first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Label className="text-sm leading-snug font-medium">{label}</Label>
        {description && (
          <span className="text-muted-foreground text-xs leading-relaxed">{description}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function IllustrationPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 border-muted-foreground/20 text-muted-foreground flex items-center justify-center rounded-lg border p-4 text-xs">
      {children}
    </div>
  )
}

function StackedField({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 py-[11px] first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Label className="text-sm leading-snug font-medium">{label}</Label>
        {description && (
          <span className="text-muted-foreground text-xs leading-relaxed">{description}</span>
        )}
      </div>
      {children}
    </div>
  )
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [version, setVersion] = useState<string>('')
  const [activeGroup, setActiveGroup] = useState<GroupId>('appearance')

  const fontSizeClass = useAppSettings((s) => s.fontSizeClass)
  const fontWeightClass = useAppSettings((s) => s.fontWeightClass)
  const letterSpacingClass = useAppSettings((s) => s.letterSpacingClass)
  const lineHeightClass = useAppSettings((s) => s.lineHeightClass)
  const fontFamilyClass = useAppSettings((s) => s.fontFamilyClass)
  const showHotSearchCard = useAppSettings((s) => s.showHotSearchCard)
  const showFollowedSuperTopicsCard = useAppSettings((s) => s.showFollowedSuperTopicsCard)
  const showExplore = useAppSettings((s) => s.showExplore)
  const showFavorites = useAppSettings((s) => s.showFavorites)
  const showHistory = useAppSettings((s) => s.showHistory)
  const showNotifications = useAppSettings((s) => s.showNotifications)
  const showDMs = useAppSettings((s) => s.showDMs)
  const showProfile = useAppSettings((s) => s.showProfile)
  const showCompose = useAppSettings((s) => s.showCompose)
  const showRightRail = useAppSettings((s) => s.showRightRail)
  const collapseRepliesEnabled = useAppSettings((s) => s.collapseRepliesEnabled)
  const renderReplyChainEnabled = useAppSettings((s) => s.renderReplyChainEnabled)
  const darkModeImageDim = useAppSettings((s) => s.darkModeImageDim)
  const theme = useAppSettings((s) => s.theme)
  const xLayoutEnabled = useAppSettings((s) => s.xLayoutEnabled)
  const contentWidth = useAppSettings((s) => s.contentWidth)
  const followGroupsEnabled = useAppSettings((s) => s.followGroupsEnabled)
  const xbTopicPage = useAppSettings((s) => s.xbTopicPage)
  const forceRedirectToFollowing = useAppSettings((s) => s.forceRedirectToFollowing)
  const selectedThemeType = useAppSettings((s) => s.selectedThemeType)
  const selectedThemeId = useAppSettings((s) => s.selectedThemeId)
  const userThemes = useAppSettings((s) => s.userThemes)
  const customThemeLightCss = useAppSettings((s) => s.customThemeLightCss)
  const customThemeDarkCss = useAppSettings((s) => s.customThemeDarkCss)
  const setFontSizeClass = useAppSettings((s) => s.setFontSizeClass)
  const setFontWeightClass = useAppSettings((s) => s.setFontWeightClass)
  const setLetterSpacingClass = useAppSettings((s) => s.setLetterSpacingClass)
  const setLineHeightClass = useAppSettings((s) => s.setLineHeightClass)
  const setFontFamilyClass = useAppSettings((s) => s.setFontFamilyClass)
  const setShowHotSearchCard = useAppSettings((s) => s.setShowHotSearchCard)
  const setShowFollowedSuperTopicsCard = useAppSettings((s) => s.setShowFollowedSuperTopicsCard)
  const setShowExplore = useAppSettings((s) => s.setShowExplore)
  const setShowFavorites = useAppSettings((s) => s.setShowFavorites)
  const setShowHistory = useAppSettings((s) => s.setShowHistory)
  const setShowNotifications = useAppSettings((s) => s.setShowNotifications)
  const setShowDMs = useAppSettings((s) => s.setShowDMs)
  const setShowProfile = useAppSettings((s) => s.setShowProfile)
  const setShowCompose = useAppSettings((s) => s.setShowCompose)
  const setShowRightRail = useAppSettings((s) => s.setShowRightRail)

  const pageElementTreeData = useMemo<TreeDataItem[]>(
    () => [
      {
        id: 'left-rail',
        name: '左侧边栏',
        icon: PanelLeft,
        disabled: true,
        children: [
          { id: 'home', name: '主页', icon: Home, disabled: true },
          { id: 'explore', name: '探索', icon: Compass },
          { id: 'favorites', name: '收藏', icon: Bookmark },
          { id: 'history', name: '历史', icon: History },
          { id: 'notifications', name: '通知', icon: Bell },
          { id: 'dms', name: '私信', icon: MessageSquare },
          { id: 'profile', name: '我的', icon: User },
          { id: 'compose', name: '发微博', icon: Pencil },
        ],
      },
      {
        id: 'right-rail',
        name: '右侧边栏',
        icon: PanelRight,
        children: [
          { id: 'hot-search', name: '热搜卡片' },
          { id: 'super-topic', name: '超话卡片' },
        ],
      },
    ],
    [],
  )

  function getSwitchState(id: string): boolean {
    switch (id) {
      case 'home':
        return true
      case 'explore':
        return showExplore
      case 'favorites':
        return showFavorites
      case 'history':
        return showHistory
      case 'notifications':
        return showNotifications
      case 'dms':
        return showDMs
      case 'profile':
        return showProfile
      case 'compose':
        return showCompose
      case 'right-rail':
        return showRightRail
      case 'hot-search':
        return showHotSearchCard
      case 'super-topic':
        return showFollowedSuperTopicsCard
      default:
        return true
    }
  }

  function setSwitchState(id: string, checked: boolean) {
    switch (id) {
      case 'explore':
        void setShowExplore(checked)
        break
      case 'favorites':
        void setShowFavorites(checked)
        break
      case 'history':
        void setShowHistory(checked)
        break
      case 'notifications':
        void setShowNotifications(checked)
        break
      case 'dms':
        void setShowDMs(checked)
        break
      case 'profile':
        void setShowProfile(checked)
        break
      case 'compose':
        void setShowCompose(checked)
        break
      case 'right-rail':
        void setShowRightRail(checked)
        break
      case 'hot-search':
        void setShowHotSearchCard(checked)
        break
      case 'super-topic':
        void setShowFollowedSuperTopicsCard(checked)
        break
    }
  }

  function renderTreeItem({ item, isLeaf }: { item: TreeDataItem; isLeaf: boolean }) {
    const isParent = !isLeaf && item.id !== 'home'
    const isRightRailChild = item.id === 'hot-search' || item.id === 'super-topic'
    const disabledByParent = isRightRailChild && !showRightRail

    return (
      <div className="flex flex-1 items-center justify-between">
        <span className="flex items-center gap-2 text-sm">
          {item.icon && <item.icon className="size-4 shrink-0" />}
          {item.name}
        </span>
        {!item.disabled && (
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={getSwitchState(item.id)}
              disabled={isParent ? false : disabledByParent}
              onCheckedChange={(checked) => setSwitchState(item.id, checked)}
            />
          </div>
        )}
      </div>
    )
  }
  const setCollapseRepliesEnabled = useAppSettings((s) => s.setCollapseRepliesEnabled)
  const setRenderReplyChainEnabled = useAppSettings((s) => s.setRenderReplyChainEnabled)
  const setDarkModeImageDim = useAppSettings((s) => s.setDarkModeImageDim)
  const setTheme = useAppSettings((s) => s.setTheme)
  const setXLayoutEnabled = useAppSettings((s) => s.setXLayoutEnabled)
  const setContentWidth = useAppSettings((s) => s.setContentWidth)
  const browsingHistoryEnabled = useAppSettings((s) => s.browsingHistoryEnabled)
  const browsingHistoryLimit = useAppSettings((s) => s.browsingHistoryLimit)
  const setBrowsingHistoryEnabled = useAppSettings((s) => s.setBrowsingHistoryEnabled)
  const setBrowsingHistoryLimit = useAppSettings((s) => s.setBrowsingHistoryLimit)
  const setFollowGroupsEnabled = useAppSettings((s) => s.setFollowGroupsEnabled)
  const setNativeTopicPage = useAppSettings((s) => s.setNativeTopicPage)
  const setForceRedirectToFollowing = useAppSettings((s) => s.setForceRedirectToFollowing)
  const setSelectedThemeType = useAppSettings((s) => s.setSelectedThemeType)
  const setSelectedThemeId = useAppSettings((s) => s.setSelectedThemeId)
  const setCustomThemeLightCss = useAppSettings((s) => s.setCustomThemeLightCss)
  const setCustomThemeDarkCss = useAppSettings((s) => s.setCustomThemeDarkCss)
  const addUserTheme = useAppSettings((s) => s.addUserTheme)
  const deleteUserTheme = useAppSettings((s) => s.deleteUserTheme)
  const updateUserTheme = useAppSettings((s) => s.updateUserTheme)

  const [themeNameInput, setThemeNameInput] = useState<string>('')
  const activeThemeName =
    selectedThemeType === 'custom'
      ? (userThemes.find((t) => t.id === selectedThemeId)?.name ?? '')
      : ''

  useEffect(() => {
    if (typeof browser !== 'undefined' && browser.runtime?.getManifest) {
      setVersion(browser.runtime.getManifest().version)
    }
  }, [])

  function resetFontSettings() {
    setFontSizeClass(DEFAULT_APP_SETTINGS.fontSizeClass)
    setFontWeightClass(DEFAULT_APP_SETTINGS.fontWeightClass)
    setLetterSpacingClass(DEFAULT_APP_SETTINGS.letterSpacingClass)
    setLineHeightClass(DEFAULT_APP_SETTINGS.lineHeightClass)
    setFontFamilyClass(DEFAULT_APP_SETTINGS.fontFamilyClass)
  }

  useEffect(() => {
    setThemeNameInput(activeThemeName)
  }, [activeThemeName])

  function handleSaveThemeName() {
    if (selectedThemeType === 'custom' && themeNameInput.trim().length > 0) {
      void updateUserTheme(selectedThemeId, { name: themeNameInput.trim() })
    }
  }

  function applyCustomThemePreset(presetKey: string) {
    const preset = CUSTOM_THEME_PRESETS.find((item) => item.key === presetKey)
    if (preset) {
      void setCustomThemeLightCss(preset.lightCss)
      void setCustomThemeDarkCss(preset.darkCss)
    }
  }

  function handleThemeSelect(value: string) {
    const [type, ...rest] = value.split(':')
    const id = rest.join(':')

    if (type === 'preset') {
      void setSelectedThemeType('preset')
      void setSelectedThemeId(id)
      applyCustomThemePreset(id)
    } else if (type === 'user') {
      const theme = userThemes.find((t) => t.id === id)
      if (theme) {
        void setSelectedThemeType('custom')
        void setSelectedThemeId(id)
        void setCustomThemeLightCss(theme.lightCss)
        void setCustomThemeDarkCss(theme.darkCss)
      }
    }
  }

  function getCurrentSelectValue(): string {
    if (selectedThemeType === 'preset') {
      return `preset:${selectedThemeId}`
    }
    return `user:${selectedThemeId}`
  }

  function handleAddCustomTheme() {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    const count = userThemes.filter((t) => t.name.startsWith('自定义主题')).length + 1
    const theme: UserTheme = {
      id,
      name: `自定义主题 ${count}`,
      lightCss: customThemeLightCss,
      darkCss: customThemeDarkCss,
    }
    void addUserTheme(theme)
    void setSelectedThemeType('custom')
    void setSelectedThemeId(id)
  }

  function handleDeleteCustomTheme() {
    if (selectedThemeType === 'custom') {
      void deleteUserTheme(selectedThemeId)
      void setSelectedThemeType('preset')
      void setSelectedThemeId('default')
      applyCustomThemePreset('default')
    }
  }

  function handleLightCssChange(value: string) {
    void setCustomThemeLightCss(value)
    if (selectedThemeType === 'custom') {
      void updateUserTheme(selectedThemeId, { lightCss: value })
    }
  }

  function handleDarkCssChange(value: string) {
    void setCustomThemeDarkCss(value)
    if (selectedThemeType === 'custom') {
      void updateUserTheme(selectedThemeId, { darkCss: value })
    }
  }

  function handleBrowsingHistoryLimitChange(value: string) {
    const limit = Number(value) as BrowsingHistoryLimit
    void setBrowsingHistoryLimit(limit).then(() => {
      browsingHistoryStore.getState().trimToLimit(limit)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[520px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="px-6 pt-5 text-base tracking-tight">设置</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>配置外观、个性化偏好和字体设置</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="border-border/40 w-[180px] shrink-0 overflow-y-auto border-r p-3">
            <div className="flex flex-col gap-0.5">
              {SIDEBAR_GROUPS.map((group) => (
                <SidebarItem
                  key={group.id}
                  icon={group.icon}
                  label={group.label}
                  active={activeGroup === group.id}
                  onClick={() => setActiveGroup(group.id)}
                />
              ))}
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            {activeGroup === 'appearance' && (
              <div className="flex flex-col">
                <div className="divide-border/40 divide-y px-6 py-4">
                  <Field label="深色模式" description="选择应用的配色方案">
                    <Select value={theme} onValueChange={(v) => setTheme(v as AppTheme)}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">跟随系统</SelectItem>
                        <SelectItem value="light">浅色</SelectItem>
                        <SelectItem value="dark">深色</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div className="border-border/40 border-t px-6 py-4">
                  <Field label="页面元素设置" />
                  <TreeView
                    data={pageElementTreeData}
                    className="max-h-[200px] overflow-y-auto"
                    renderItem={renderTreeItem}
                  />
                </div>
              </div>
            )}

            {activeGroup === 'theme' && (
              <div className="divide-border/40 divide-y px-6 py-4">
                <div className="flex items-center justify-between gap-4 py-[11px] first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Select value={getCurrentSelectValue()} onValueChange={handleThemeSelect}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>预设主题</SelectLabel>
                          {CUSTOM_THEME_PRESETS.map((preset) => (
                            <SelectItem key={`preset:${preset.key}`} value={`preset:${preset.key}`}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        {userThemes.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>自定义主题</SelectLabel>
                            {userThemes.map((theme) => (
                              <SelectItem key={`user:${theme.id}`} value={`user:${theme.id}`}>
                                {theme.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </SelectContent>
                    </Select>
                    {selectedThemeType === 'custom' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDeleteCustomTheme}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        aria-label="删除主题"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleAddCustomTheme}>
                    添加自定义主题
                  </Button>
                </div>
                {selectedThemeType === 'custom' && (
                  <>
                    <div className="flex items-center gap-2 py-[11px] first:pt-0 last:pb-0">
                      <Label className="shrink-0 text-sm leading-snug font-medium">主题名称</Label>
                      <input
                        type="text"
                        value={themeNameInput}
                        onChange={(e) => setThemeNameInput(e.target.value)}
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                      />
                      <Button
                        variant="default"
                        size="sm"
                        disabled={themeNameInput === activeThemeName}
                        onClick={handleSaveThemeName}
                      >
                        保存
                      </Button>
                    </div>
                    <StackedField
                      label="浅色主题样式变量"
                      description="每行输入一个 CSS 变量声明，例如 --foreground: #333333;"
                    >
                      <Textarea
                        value={customThemeLightCss}
                        onChange={(event) => {
                          handleLightCssChange(event.target.value)
                        }}
                        rows={10}
                        spellCheck={false}
                        className="min-h-[210px] resize-none font-mono text-xs leading-relaxed"
                        placeholder="--background: oklch(1.0000 0 0);
--foreground: #333333;"
                      />
                    </StackedField>
                    <StackedField
                      label="深色主题样式变量"
                      description="每行输入一个 CSS 变量声明，例如 --background: #000000;"
                    >
                      <Textarea
                        value={customThemeDarkCss}
                        onChange={(event) => {
                          handleDarkCssChange(event.target.value)
                        }}
                        rows={10}
                        spellCheck={false}
                        className="min-h-[210px] resize-none font-mono text-xs leading-relaxed"
                        placeholder="--background: oklch(0.1450 0 0);
--foreground: #ffffff;"
                      />
                    </StackedField>
                  </>
                )}
              </div>
            )}

            {activeGroup === 'personalize' && (
              <div className="space-y-3 px-6 py-4">
                <div>
                  <Field label="图片蒙版" description="深色模式下为小图添加变暗效果防刺眼">
                    <Switch
                      checked={darkModeImageDim}
                      onCheckedChange={(checked) => setDarkModeImageDim(checked)}
                    />
                  </Field>
                  <IllustrationPlaceholder>
                    <img src={darkModeImageDimJpeg} alt="图片蒙版" className="h-auto w-full" />
                  </IllustrationPlaceholder>
                </div>
                <div>
                  <Field label="内容宽度" description="大屏幕下中间内容区域的宽度">
                    <Select
                      value={contentWidth}
                      onValueChange={(v) => setContentWidth(v as ContentWidth)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">标准</SelectItem>
                        <SelectItem value="wide">宽</SelectItem>
                        <SelectItem value="wider">更宽</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
                <div>
                  <Field label="X 操作栏" description="使用 X 风格的操作栏（含收藏和分享按钮）">
                    <Switch
                      checked={xLayoutEnabled}
                      onCheckedChange={(checked) => setXLayoutEnabled(checked)}
                    />
                  </Field>
                  <IllustrationPlaceholder>
                    <img src={xLayoutJpeg} alt="X 操作栏布局" className="h-auto w-full" />
                  </IllustrationPlaceholder>
                </div>
                <div>
                  <Field label="关注分组" description="在我关注的中展示我的分组筛选">
                    <Switch
                      checked={followGroupsEnabled}
                      onCheckedChange={(checked) => setFollowGroupsEnabled(checked)}
                    />
                  </Field>
                </div>
                <div>
                  <Field
                    label="强制跳转我关注的"
                    description="打开后，进入首页时自动跳转到「我关注的」"
                  >
                    <Switch
                      checked={forceRedirectToFollowing}
                      onCheckedChange={(checked) => setForceRedirectToFollowing(checked)}
                    />
                  </Field>
                </div>
                <div>
                  <Field label="QuoteChains 渲染" description='将 "//@ 用户名:" 格式渲染成引用样式'>
                    <Switch
                      checked={renderReplyChainEnabled}
                      onCheckedChange={(checked) => setRenderReplyChainEnabled(checked)}
                    />
                  </Field>
                  <IllustrationPlaceholder>
                    <img src={quoteChainsJpeg} alt="QuoteChains 渲染" className="h-auto w-full" />
                  </IllustrationPlaceholder>
                </div>
                {renderReplyChainEnabled && (
                  <div>
                    <Field label="折叠 QuoteChains" description="超过2条时折叠中间的引用">
                      <Switch
                        checked={collapseRepliesEnabled}
                        onCheckedChange={(checked) => setCollapseRepliesEnabled(checked)}
                      />
                    </Field>
                    <IllustrationPlaceholder>
                      <img
                        src={collapseReplyChain}
                        alt="折叠 QuoteChains"
                        className="h-auto w-full"
                      />
                    </IllustrationPlaceholder>
                  </div>
                )}
              </div>
            )}

            {activeGroup === 'font' && (
              <div className="flex flex-col">
                <div className="bg-background sticky top-0 z-10 border-b px-6 py-4">
                  <FontPreviewCard />
                </div>

                <div className="divide-border/40 divide-y px-6 py-4">
                  <Field label="字体大小" description="微博正文和评论的字体大小">
                    <Select
                      value={fontSizeClass}
                      onValueChange={(v) => setFontSizeClass(v as FontSizeClass)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text-xs">12px</SelectItem>
                        <SelectItem value="text-sm">14px</SelectItem>
                        <SelectItem value="text-base">16px</SelectItem>
                        <SelectItem value="text-lg">18px</SelectItem>
                        <SelectItem value="text-xl">20px</SelectItem>
                        <SelectItem value="text-2xl">24px</SelectItem>
                        <SelectItem value="text-3xl">30px</SelectItem>
                        <SelectItem value="text-4xl">36px</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="字体粗细" description="微博正文和评论的字体粗细">
                    <Select
                      value={fontWeightClass}
                      onValueChange={(v) => setFontWeightClass(v as FontWeightClass)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="font-thin">100 细</SelectItem>
                        <SelectItem value="font-extralight">200</SelectItem>
                        <SelectItem value="font-light">300</SelectItem>
                        <SelectItem value="font-normal">400 标准</SelectItem>
                        <SelectItem value="font-medium">500</SelectItem>
                        <SelectItem value="font-semibold">600</SelectItem>
                        <SelectItem value="font-bold">700 粗</SelectItem>
                        <SelectItem value="font-extrabold">800</SelectItem>
                        <SelectItem value="font-black">900</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="字间距" description="字符之间的间距">
                    <Select
                      value={letterSpacingClass}
                      onValueChange={(v) => setLetterSpacingClass(v as LetterSpacingClass)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tracking-tighter">更紧凑</SelectItem>
                        <SelectItem value="tracking-tight">紧凑</SelectItem>
                        <SelectItem value="tracking-normal">标准</SelectItem>
                        <SelectItem value="tracking-wide">宽松</SelectItem>
                        <SelectItem value="tracking-wider">更宽松</SelectItem>
                        <SelectItem value="tracking-widest">最宽松</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="行高" description="文本行之间的间距">
                    <Select
                      value={lineHeightClass}
                      onValueChange={(v) => setLineHeightClass(v as LineHeightClass)}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leading-none">无</SelectItem>
                        <SelectItem value="leading-tight">紧凑</SelectItem>
                        <SelectItem value="leading-snug">适中偏紧</SelectItem>
                        <SelectItem value="leading-normal">标准</SelectItem>
                        <SelectItem value="leading-relaxed">宽松</SelectItem>
                        <SelectItem value="leading-loose">更宽松</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field label="字体样式" description="微博正文和评论的字体">
                    <Select
                      value={fontFamilyClass}
                      onValueChange={(v) => setFontFamilyClass(v as FontFamilyClass)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>本地字体</SelectLabel>
                          <SelectItem value="font-sans">默认无衬线</SelectItem>
                          <SelectItem value="font-serif">默认衬线</SelectItem>
                          <SelectItem value="font-simhei">黑体</SelectItem>
                          <SelectItem value="font-simsun">宋体</SelectItem>
                          <SelectItem value="font-kaiti">楷体</SelectItem>
                          <SelectItem value="font-fangsong">仿宋</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>远程字体</SelectLabel>
                          <SelectItem value="font-lxgw-wenkai">霞鹜文楷</SelectItem>
                          <SelectItem value="font-smiley-sans">得意黑</SelectItem>
                          <SelectItem value="font-zhuque">朱雀仿宋</SelectItem>
                          <SelectItem value="font-source-han-serif">思源宋体</SelectItem>
                          <SelectItem value="font-source-han-sans">思源黑体</SelectItem>
                          <SelectItem value="font-fz-kai">方正楷体</SelectItem>
                          <SelectItem value="font-canger-jinkai">仓耳今楷</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>

                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" onClick={resetFontSettings}>
                      恢复默认
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeGroup === 'advanced' && (
              <div className="divide-border/40 divide-y px-6 py-4">
                <Field label="内置话题页" description="使用 xb 内置话题页，关闭则跳转原微博话题页">
                  <Switch
                    checked={xbTopicPage}
                    onCheckedChange={(checked) => setNativeTopicPage(checked)}
                  />
                </Field>
                <Field
                  label="浏览历史"
                  description={`记录最近访问过的${browsingHistoryLimit}条微博（储存在本地）`}
                >
                  <Switch
                    checked={browsingHistoryEnabled}
                    onCheckedChange={(checked) => setBrowsingHistoryEnabled(checked)}
                  />
                </Field>
                {browsingHistoryEnabled && (
                  <Field label="保留条数" description="超过上限后自动删除最早的记录">
                    <Select
                      value={String(browsingHistoryLimit)}
                      onValueChange={handleBrowsingHistoryLimitChange}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {BROWSING_HISTORY_LIMIT_OPTIONS.map((limit) => (
                            <SelectItem key={limit} value={String(limit)}>
                              {limit} 条
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </div>
            )}
          </main>
        </div>

        {version && (
          <div className="border-border/40 flex shrink-0 items-center justify-between border-t px-6 py-3">
            <a
              href="https://xb-extension.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground font-mono text-[11px] transition-colors"
            >
              xb v{version}
            </a>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/nnecec"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground text-[11px] transition-colors"
              >
                @nnecec
              </a>
              <a
                href="https://github.com/nnecec/xb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground text-[11px] transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
