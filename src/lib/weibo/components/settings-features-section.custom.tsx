import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { FlatAppSettings, StatusDetailPopupPosition } from '@/lib/app-settings'
import { type AppSettingsStoreState, useAppSettings, useShallow } from '@/lib/app-settings-store'
import { cn } from '@/lib/utils'

import {
  defaultsFor,
  Field,
  ResetSectionButton,
  SettingsPanel,
  StackedField,
} from './settings-dialog-ui'

const FEATURES_SETTING_KEYS = [
  'statusDetailPopupEnabled',
  'statusDetailPopupPosition',
  'statusDetailPopupWidth',
  'waterfallColumnCount',
  'waterfallExpandOnWideLayout',
  'backgroundEnabled',
  'backgroundImageUrl',
  'glassOpacity',
  'glassBlur',
] as const satisfies readonly (keyof FlatAppSettings)[]

export function SettingsFeaturesSection({
  updateSettings,
}: {
  updateSettings: AppSettingsStoreState['updateSettings']
}) {
  const settings = useAppSettings(
    useShallow((state) => ({
      statusDetailPopupEnabled: state.appearance.statusDetailPopupEnabled,
      statusDetailPopupPosition: state.appearance.statusDetailPopupPosition,
      statusDetailPopupWidth: state.appearance.statusDetailPopupWidth,
      waterfallColumnCount: state.feed.waterfallColumnCount,
      waterfallExpandOnWideLayout: state.feed.waterfallExpandOnWideLayout,
      backgroundEnabled: state.appearance.backgroundEnabled,
      backgroundImageUrl: state.appearance.backgroundImageUrl,
      glassOpacity: state.appearance.glassOpacity,
      glassBlur: state.appearance.glassBlur,
    })),
  )
  const [imagePreviewError, setImagePreviewError] = useState(false)
  const [imagePreviewNonce, setImagePreviewNonce] = useState(0)
  const validateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const validateImageUrl = useCallback((url: string) => {
    if (validateTimerRef.current) {
      clearTimeout(validateTimerRef.current)
    }
    setImagePreviewError(false)
    setImagePreviewNonce((nonce) => nonce + 1)

    if (!url) return

    validateTimerRef.current = setTimeout(async () => {
      try {
        const resp = await fetch(url, { method: 'HEAD', mode: 'no-cors' })
        if (resp.type === 'opaque') return
        if (!resp.ok) {
          toast.warning(`背景图片加载失败 (HTTP ${resp.status})`, {
            description: '请检查 URL 是否正确',
          })
          setImagePreviewError(true)
        }
      } catch {}
    }, 800)
  }, [])

  const handleBackgroundImageUrlChange = useCallback(
    (url: string) => {
      void updateSettings({ appearance: { backgroundImageUrl: url } })
      validateImageUrl(url)
    },
    [updateSettings, validateImageUrl],
  )

  return (
    <SettingsPanel>
      <Field label="弹窗详情" description="点击微博后在弹窗中打开详情，而非新页面">
        <Switch
          aria-label="弹窗详情"
          checked={settings.statusDetailPopupEnabled}
          onCheckedChange={(checked) =>
            void updateSettings({
              appearance: { statusDetailPopupEnabled: checked },
              ...(checked && { feed: { feedInteractionMode: 'x' as const } }),
            })
          }
        />
      </Field>

      {settings.statusDetailPopupEnabled ? (
        <Field label="弹窗位置" description="详情弹窗在屏幕上的显示位置">
          <Select
            value={settings.statusDetailPopupPosition}
            onValueChange={(value) =>
              void updateSettings({
                appearance: { statusDetailPopupPosition: value as StatusDetailPopupPosition },
              })
            }
          >
            <SelectTrigger className="w-[100px]" aria-label="弹窗位置">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">左</SelectItem>
              <SelectItem value="center">中</SelectItem>
              <SelectItem value="right">右</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      ) : null}

      {settings.statusDetailPopupEnabled ? (
        <StackedField
          label="弹窗宽度"
          description={`详情弹窗占页面宽度的比例 (${settings.statusDetailPopupWidth}%)`}
        >
          <Slider
            min={50}
            max={80}
            step={5}
            value={[settings.statusDetailPopupWidth]}
            aria-label="弹窗宽度"
            onValueChange={([value]) => {
              if (value !== undefined)
                void updateSettings({ appearance: { statusDetailPopupWidth: value } })
            }}
          />
        </StackedField>
      ) : null}

      <StackedField
        label="瀑布流栏数"
        description={`设为 1 时关闭瀑布流，2-5 栏自适应排列 (${settings.waterfallColumnCount} 栏)，单栏不低于 300px`}
      >
        <Slider
          min={1}
          max={5}
          step={1}
          value={[settings.waterfallColumnCount]}
          aria-label="瀑布流栏数"
          onValueChange={([value]) => {
            if (value !== undefined) void updateSettings({ feed: { waterfallColumnCount: value } })
          }}
        />
      </StackedField>

      <Field
        label="展开时放大卡片"
        description="当主栏空间变宽时（沉浸模式/收起左栏），增加单个卡片宽度而非列数"
      >
        <Switch
          aria-label="展开时放大卡片"
          checked={settings.waterfallExpandOnWideLayout}
          onCheckedChange={(checked) =>
            void updateSettings({ feed: { waterfallExpandOnWideLayout: checked } })
          }
        />
      </Field>

      <Field label="自定义背景" description="为页面添加自定义背景图片">
        <Switch
          aria-label="自定义背景"
          checked={settings.backgroundEnabled}
          onCheckedChange={(checked) =>
            void updateSettings({ appearance: { backgroundEnabled: checked } })
          }
        />
      </Field>

      {settings.backgroundEnabled ? (
        <Field label="背景图片" description="输入图片 URL 作为背景">
          <div className="flex items-center gap-2">
            <Input
              type="url"
              placeholder="https://example.com/bg.jpg"
              value={settings.backgroundImageUrl}
              onChange={(e) => handleBackgroundImageUrlChange(e.target.value)}
              className="h-8 w-[180px]"
            />
            {settings.backgroundImageUrl ? (
              <div
                className={cn(
                  'size-8 shrink-0 overflow-hidden rounded-md border',
                  imagePreviewError && 'border-destructive',
                )}
              >
                <img
                  src={`${settings.backgroundImageUrl}${settings.backgroundImageUrl.includes('?') ? '&' : '?'}t=${imagePreviewNonce}`}
                  alt="背景预览"
                  className="block size-full object-cover"
                  onError={() => setImagePreviewError(true)}
                  onLoad={() => setImagePreviewError(false)}
                />
              </div>
            ) : null}
          </div>
        </Field>
      ) : null}

      <StackedField
        label="玻璃透明度"
        description={`卡片和弹窗的半透明程度 (${settings.glassOpacity}%)`}
      >
        <Slider
          min={0}
          max={100}
          step={5}
          value={[settings.glassOpacity]}
          aria-label="玻璃透明度"
          onValueChange={([value]) => {
            if (value !== undefined) void updateSettings({ appearance: { glassOpacity: value } })
          }}
        />
      </StackedField>

      <StackedField
        label="玻璃模糊"
        description={`卡片和弹窗的背景模糊程度 (${settings.glassBlur}px)`}
      >
        <Slider
          min={0}
          max={20}
          step={1}
          value={[settings.glassBlur]}
          aria-label="玻璃模糊"
          onValueChange={([value]) => {
            if (value !== undefined) void updateSettings({ appearance: { glassBlur: value } })
          }}
        />
      </StackedField>

      <ResetSectionButton
        label="特色功能"
        keys={FEATURES_SETTING_KEYS}
        onReset={() => void updateSettings(defaultsFor(FEATURES_SETTING_KEYS))}
      />
    </SettingsPanel>
  )
}
