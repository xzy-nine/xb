import React from 'react'
import { useEffect, useState } from 'react'

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DEFAULT_APP_SETTINGS } from '@/lib/app-settings'
import type {
  FontFamilyClass,
  FontSizeClass,
  FontWeightClass,
  LetterSpacingClass,
  LineHeightClass,
} from '@/lib/app-settings'
import { useAppSettings } from '@/lib/app-settings-store'

function Field({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Label>{label}</Label>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </div>
      {children}
    </div>
  )
}

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    if (typeof browser !== 'undefined' && browser.runtime?.getManifest) {
      setVersion(browser.runtime.getManifest().version)
    }
  }, [])

  const fontSizeClass = useAppSettings((s) => s.fontSizeClass)
  const fontWeightClass = useAppSettings((s) => s.fontWeightClass)
  const letterSpacingClass = useAppSettings((s) => s.letterSpacingClass)
  const lineHeightClass = useAppSettings((s) => s.lineHeightClass)
  const fontFamilyClass = useAppSettings((s) => s.fontFamilyClass)
  const showHotSearchCard = useAppSettings((s) => s.showHotSearchCard)
  const collapseRepliesEnabled = useAppSettings((s) => s.collapseRepliesEnabled)
  const darkModeImageDim = useAppSettings((s) => s.darkModeImageDim)
  const setFontSizeClass = useAppSettings((s) => s.setFontSizeClass)
  const setFontWeightClass = useAppSettings((s) => s.setFontWeightClass)
  const setLetterSpacingClass = useAppSettings((s) => s.setLetterSpacingClass)
  const setLineHeightClass = useAppSettings((s) => s.setLineHeightClass)
  const setFontFamilyClass = useAppSettings((s) => s.setFontFamilyClass)
  const setShowHotSearchCard = useAppSettings((s) => s.setShowHotSearchCard)
  const setCollapseRepliesEnabled = useAppSettings((s) => s.setCollapseRepliesEnabled)
  const setDarkModeImageDim = useAppSettings((s) => s.setDarkModeImageDim)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>配置字体大小、字体样式和显示偏好</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <Tabs defaultValue="personalize">
          <TabsList className="w-full">
            <TabsTrigger value="personalize" className="flex-1">
              个性化
            </TabsTrigger>
            <TabsTrigger value="font" className="flex-1">
              微博字体
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personalize" className="flex flex-col gap-6 py-4">
            <Field label="热搜卡片" description="在右侧边栏显示热搜内容">
              <Switch
                checked={showHotSearchCard}
                onCheckedChange={(checked) => setShowHotSearchCard(checked)}
              />
            </Field>

            <Field label="折叠引用" description="微博中引用超过2条时折叠中间的引用">
              <Switch
                checked={collapseRepliesEnabled}
                onCheckedChange={(checked) => setCollapseRepliesEnabled(checked)}
              />
            </Field>

            <Field label="图片蒙版" description="深色模式下为小图添加变暗效果防刺眼">
              <Switch
                checked={darkModeImageDim}
                onCheckedChange={(checked) => setDarkModeImageDim(checked)}
              />
            </Field>
          </TabsContent>

          <TabsContent value="font" className="flex flex-col gap-6 py-4">
            <Field label="字体大小" description="微博正文和评论的字体大小">
              <Select
                value={fontSizeClass}
                onValueChange={(value) => setFontSizeClass(value as FontSizeClass)}
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

            <Field label="字体字重" description="微博正文和评论的字体粗细">
              <Select
                value={fontWeightClass}
                onValueChange={(value) => setFontWeightClass(value as FontWeightClass)}
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
                onValueChange={(value) => setLetterSpacingClass(value as LetterSpacingClass)}
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
                onValueChange={(value) => setLineHeightClass(value as LineHeightClass)}
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
                onValueChange={(value) => setFontFamilyClass(value as FontFamilyClass)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="font-sans">无衬线</SelectItem>
                  <SelectItem value="font-serif">衬线</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFontSizeClass(DEFAULT_APP_SETTINGS.fontSizeClass)
                  setFontWeightClass(DEFAULT_APP_SETTINGS.fontWeightClass)
                  setLetterSpacingClass(DEFAULT_APP_SETTINGS.letterSpacingClass)
                  setLineHeightClass(DEFAULT_APP_SETTINGS.lineHeightClass)
                  setFontFamilyClass(DEFAULT_APP_SETTINGS.fontFamilyClass)
                }}
              >
                恢复默认
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {version && (
          <div className="flex items-center justify-between border-t pt-4">
            <a
              href="https://xb-extension.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              xb v{version}
            </a>
            <a
              href="https://github.com/nnecec"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              by nnecec
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
