import { describe, expect, it } from 'vitest'

import { getContentWidthAdjustedMaxWidth } from '@/lib/weibo/app/content-width'

describe('getContentWidthAdjustedMaxWidth', () => {
  it('keeps the standard width unchanged', () => {
    expect(getContentWidthAdjustedMaxWidth('standard', 720)).toBe('720px')
  })

  it('adds the wide delta to the base width', () => {
    expect(getContentWidthAdjustedMaxWidth('wide', 672)).toBe('772px')
  })

  it('adds the wider delta to the base width', () => {
    expect(getContentWidthAdjustedMaxWidth('wider', 720)).toBe('920px')
  })
})
