import { Check } from 'lucide-react'

import type { BgColorPresetDef, BackgroundColorPreset } from '@/lib/app-settings'

interface BgColorPickerProps {
  presets: BgColorPresetDef[]
  value: BackgroundColorPreset
  onChange: (value: BackgroundColorPreset) => void
}

export function BgColorPicker({ presets, value, onChange }: BgColorPickerProps) {
  return (
    <div className="flex gap-3">
      {presets.map((preset) => {
        const isSelected = preset.key === value
        return (
          <button
            key={preset.key}
            type="button"
            onClick={() => onChange(preset.key)}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform active:scale-95"
              style={{
                backgroundColor: preset.background,
                borderColor: isSelected ? 'var(--foreground)' : 'var(--border)',
              }}
            >
              {isSelected && <Check className="h-4 w-4" style={{ color: preset.card }} />}
            </div>
            <span className="text-muted-foreground text-xs">{preset.name}</span>
          </button>
        )
      })}
    </div>
  )
}
