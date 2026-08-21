import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { DEFAULT_APP_SETTINGS, type StatusDetailPopupPosition } from '@/lib/app-settings'
import { cn } from '@/lib/utils'

import { Field } from './settings-dialog-ui'

interface SettingsFeaturesSectionProps {
  statusDetailPopupEnabled: boolean
  statusDetailPopupPosition: StatusDetailPopupPosition
  statusDetailPopupWidth: number
  backgroundEnabled: boolean
  backgroundImageUrl: string
  glassOpacity: number
  glassBlur: number
  waterfallColumnCount: number
  waterfallExpandOnWideLayout: boolean
  updateSettings: (patch: Record<string, unknown>) => void
}

export function SettingsFeaturesSection({
  statusDetailPopupEnabled,
  statusDetailPopupPosition,
  statusDetailPopupWidth,
  backgroundEnabled,
  backgroundImageUrl,
  glassOpacity,
  glassBlur,
  waterfallColumnCount,
  waterfallExpandOnWideLayout,
  updateSettings,
}: SettingsFeaturesSectionProps) {
  const [imagePreviewError, setImagePreviewError] = useState(false)
  const validateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const validateImageUrl = useCallback((url: string) => {
    if (validateTimerRef.current) {
      clearTimeout(validateTimerRef.current)
    }
    setImagePreviewError(false)

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
      updateSettings({ backgroundImageUrl: url })
      validateImageUrl(url)
    },
    [updateSettings, validateImageUrl],
  )

  return (
    <div className="divide-border/40 divide-y px-6 py-4">
      <Field label="弹窗详情" description="点击微博后在弹窗中打开详情，而非新页面">
        <Switch
          checked={statusDetailPopupEnabled}
          onCheckedChange={(checked) =>
            void updateSettings({
              statusDetailPopupEnabled: checked,
              ...(checked && { feedInteractionMode: 'x' }),
            })
          }
        />
      </Field>

      {statusDetailPopupEnabled && (
        <Field label="弹窗位置" description="详情弹窗在屏幕上的显示位置">
          <Select
            value={statusDetailPopupPosition}
            onValueChange={(value) =>
              updateSettings({
                statusDetailPopupPosition: value as StatusDetailPopupPosition,
              })
            }
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">左</SelectItem>
              <SelectItem value="center">中</SelectItem>
              <SelectItem value="right">右</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      )}

      {statusDetailPopupEnabled && (
        <div className="flex flex-col gap-2">
          <Label>弹窗宽度</Label>
          <p className="text-muted-foreground text-xs">
            详情弹窗占页面宽度的比例 ({statusDetailPopupWidth}%)
          </p>
          <Slider
            value={[statusDetailPopupWidth]}
            min={50}
            max={80}
            step={5}
            onValueChange={([value]) => void updateSettings({ statusDetailPopupWidth: value })}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>瀑布流栏数</Label>
        <p className="text-muted-foreground text-xs">
          设为 1 时关闭瀑布流，2-5 栏自适应排列 ({waterfallColumnCount} 栏)单栏不低于 300px
        </p>
        <Slider
          value={[waterfallColumnCount]}
          min={1}
          max={5}
          step={1}
          onValueChange={([value]) => void updateSettings({ waterfallColumnCount: value })}
        />
      </div>

      <Field
        label="展开时放大卡片"
        description="当主栏空间变宽时（沉浸模式/收起左栏），增加单个卡片宽度而非列数"
      >
        <Switch
          checked={waterfallExpandOnWideLayout}
          onCheckedChange={(checked) =>
            void updateSettings({ waterfallExpandOnWideLayout: checked })
          }
        />
      </Field>

      <Field label="自定义背景" description="为页面添加自定义背景图片">
        <Switch
          checked={backgroundEnabled}
          onCheckedChange={(checked) => void updateSettings({ backgroundEnabled: checked })}
        />
      </Field>

      {backgroundEnabled && (
        <Field label="背景图片" description="输入图片 URL 作为背景">
          <div className="flex items-center gap-2">
            <Input
              type="url"
              placeholder="https://example.com/bg.jpg"
              value={backgroundImageUrl}
              onChange={(e) => handleBackgroundImageUrlChange(e.target.value)}
              className="h-8 w-[180px]"
            />
            {backgroundImageUrl ? (
              <div
                className={cn(
                  'size-8 shrink-0 overflow-hidden rounded-md border',
                  imagePreviewError && 'border-destructive',
                )}
              >
                <img
                  src={`${backgroundImageUrl}${backgroundImageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                  alt="背景预览"
                  className="block size-full object-cover"
                  onError={() => setImagePreviewError(true)}
                  onLoad={() => setImagePreviewError(false)}
                />
              </div>
            ) : null}
          </div>
        </Field>
      )}

      <div className="flex flex-col gap-2">
        <Label>玻璃透明度</Label>
        <p className="text-muted-foreground text-xs">卡片和弹窗的半透明程度 ({glassOpacity}%)</p>
        <Slider
          value={[glassOpacity]}
          min={0}
          max={100}
          step={5}
          onValueChange={([v]) => void updateSettings({ glassOpacity: v })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>玻璃模糊</Label>
        <p className="text-muted-foreground text-xs">卡片和弹窗的背景模糊程度 ({glassBlur}px)</p>
        <Slider
          value={[glassBlur]}
          min={0}
          max={20}
          step={1}
          onValueChange={([v]) => void updateSettings({ glassBlur: v })}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void updateSettings({
              contentWidth: DEFAULT_APP_SETTINGS.contentWidth,
              statusDetailPopupEnabled: DEFAULT_APP_SETTINGS.statusDetailPopupEnabled,
              statusDetailPopupPosition: DEFAULT_APP_SETTINGS.statusDetailPopupPosition,
              statusDetailPopupWidth: DEFAULT_APP_SETTINGS.statusDetailPopupWidth,
              waterfallColumnCount: DEFAULT_APP_SETTINGS.waterfallColumnCount,
              backgroundEnabled: DEFAULT_APP_SETTINGS.backgroundEnabled,
              backgroundImageUrl: DEFAULT_APP_SETTINGS.backgroundImageUrl,
              glassOpacity: DEFAULT_APP_SETTINGS.glassOpacity,
              glassBlur: DEFAULT_APP_SETTINGS.glassBlur,
              followGroupsEnabled: DEFAULT_APP_SETTINGS.followGroupsEnabled,
            })
          }}
        >
          恢复默认
        </Button>
      </div>
    </div>
  )
}
