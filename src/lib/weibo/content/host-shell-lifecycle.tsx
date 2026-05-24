import { createRoot, type Root } from 'react-dom/client'

import { setUiPortalContainer } from '@/components/ui/portal'
import { getAppSettingsStore } from '@/lib/app-settings-store'
import { AppRoot } from '@/lib/weibo/app/app-root'
import { waitForWeiboHostRegions } from '@/lib/weibo/content/host-selectors'
import { markWeiboPageReady } from '@/lib/weibo/content/page-takeover'
import { bindShellState } from '@/lib/weibo/content/shell-state'

interface MountedWeiboUi {
  root: Root
  cleanup: () => void
}

export function injectSonnerStyles(shadow: ShadowRoot, styles: string) {
  const existingStyle = shadow.querySelector('[data-sonner-styles]')
  if (existingStyle) return

  const style = document.createElement('style')
  style.setAttribute('data-sonner-styles', '')
  style.textContent = styles
  shadow.appendChild(style)
}

export async function mountWeiboHostShell({
  ctx,
  sonnerStyles,
}: {
  ctx: Parameters<typeof createShadowRootUi>[0]
  sonnerStyles: string
}): Promise<ShadowRootContentScriptUi<MountedWeiboUi> | null> {
  await injectScript('/weibo-main-world.js', { keepInDom: true })

  const regions = await waitForWeiboHostRegions(document)
  if (!regions) {
    markWeiboPageReady()
    return null
  }

  const settingsStore = getAppSettingsStore()
  await settingsStore.getState().hydrate()

  const ui = await createShadowRootUi(ctx, {
    name: 'xb-shell',
    position: 'inline',
    anchor: 'body',
    append: 'first',
    onMount(container, shadow) {
      injectSonnerStyles(shadow, sonnerStyles)
      setUiPortalContainer(container)
      const cleanup = bindShellState({
        container: container as unknown as HTMLElement,
        appRoot: regions.appRoot,
        settingsStore,
      })
      const root = createRoot(container)
      root.render(<AppRoot />)
      return { cleanup, root }
    },
    onRemove(mounted?: MountedWeiboUi) {
      setUiPortalContainer(null)
      mounted?.cleanup()
      mounted?.root.unmount()
    },
  })

  ui.mount()
  return ui
}
