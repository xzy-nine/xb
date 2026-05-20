import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { ShellFrame } from '@/lib/weibo/app/app-shell-layout'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

vi.mock('@/lib/weibo/components/right-rail', () => ({
  RightRail: () => <div data-testid="right-rail">right rail</div>,
}))

describe('ShellFrame', () => {
  it('renders one navigation landmark and preserves page content', () => {
    const mainRef = createRef<HTMLDivElement>()
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ShellFrame
            pageKind="home"
            viewingProfileUserId={null}
            rewriteEnabled
            theme="system"
            contentWidth="standard"
            browsingHistoryEnabled={false}
            onRewriteEnabledChange={vi.fn()}
            onThemeChange={vi.fn()}
            onSettingsOpen={vi.fn()}
            onComposeOpen={vi.fn()}
            mainRef={mainRef}
          >
            <div>center content</div>
          </ShellFrame>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getAllByRole('navigation', { name: '主导航' })).toHaveLength(1)
    expect(screen.getByText('center content')).toBeInTheDocument()
  })
})
