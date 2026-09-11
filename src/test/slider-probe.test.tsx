import { render, cleanup } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'

import { Slider } from '@/components/ui/slider'

afterEach(cleanup)

test('slider probe', () => {
  const { container } = render(
    <Slider min={160} max={1200} step={10} value={[650]} aria-label="probe" />,
  )
  const thumb = container.querySelector('[data-slot="slider-thumb"]') as HTMLElement
  const wrapper = thumb.parentElement as HTMLElement
  console.log('wrapper tag/style:', wrapper.tagName, JSON.stringify(wrapper.style.cssText))
  console.log('thumb style:', JSON.stringify(thumb.style.cssText))
  console.log('thumb aria-valuenow:', thumb.getAttribute('aria-valuenow'))
  const root = thumb.closest('[data-slot="slider"]') as HTMLElement
  console.log(
    'root dir:',
    root.getAttribute('dir'),
    '| orientation:',
    root.getAttribute('data-orientation'),
  )
  expect(true).toBe(true)
})
