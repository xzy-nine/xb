import type {
  FontFamilyClass,
  FontSizeClass,
  FontWeightClass,
  LetterSpacingClass,
  LineHeightClass,
} from '@/lib/app-settings'
import { useAppSettings } from '@/lib/app-settings-store'

export function useFontSettings() {
  const fontSizeClass = useAppSettings((s) => s.fontSizeClass) as FontSizeClass
  const fontWeightClass = useAppSettings((s) => s.fontWeightClass) as FontWeightClass
  const letterSpacingClass = useAppSettings((s) => s.letterSpacingClass) as LetterSpacingClass
  const lineHeightClass = useAppSettings((s) => s.lineHeightClass) as LineHeightClass
  const fontFamilyClass = useAppSettings((s) => s.fontFamilyClass) as FontFamilyClass

  return {
    fontSizeClass,
    fontWeightClass,
    letterSpacingClass,
    lineHeightClass,
    fontFamilyClass,
  }
}
