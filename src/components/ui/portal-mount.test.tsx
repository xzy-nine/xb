import { fireEvent, render } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { setUiPortalContainer } from './portal'
import { UiPortalMount } from './portal-mount'

function Clicker({ onActivate }: { onActivate: () => void }) {
  const [count, setCount] = useState(0)
  return (
    <div data-testid="host">
      <button
        type="button"
        data-testid="button"
        onClick={() => {
          setCount(count + 1)
          onActivate()
        }}
      >
        {count}
      </button>
    </div>
  )
}

function setup() {
  const portalContainer = document.createElement('div')
  setUiPortalContainer(portalContainer)
  const container = document.createElement('div')
  document.body.appendChild(container)
  return { container, portalContainer }
}

describe('UiPortalMount', () => {
  afterEach(() => {
    setUiPortalContainer(null)
    document.body.replaceChildren()
  })

  it('mounts the portal container inside the react root container', () => {
    const { container, portalContainer } = setup()

    render(
      <>
        <span />
        <UiPortalMount container={container} />
      </>,
      { container },
    )

    expect(container.contains(portalContainer)).toBe(true)
  })

  it('keeps react events working after a node is moved into the portal container', () => {
    const { container, portalContainer } = setup()
    const onActivate = vi.fn()

    const { getByTestId } = render(
      <>
        <Clicker onActivate={onActivate} />
        <UiPortalMount container={container} />
      </>,
      { container },
    )

    // 网页全屏会把播放器的 DOM 节点直接搬进 portal 容器
    const host = getByTestId('host')
    portalContainer.appendChild(host)
    fireEvent.click(getByTestId('button'))

    expect(onActivate).toHaveBeenCalledTimes(1)

    container.appendChild(host)
  })
})
