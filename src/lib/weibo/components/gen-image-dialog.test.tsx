import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import type { FeedItem } from '@/lib/weibo/models/feed'

import { GenImageDialog } from './gen-image-dialog'

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toBlob: vi.fn().mockResolvedValue(new Blob(['fake-image'], { type: 'image/png' })),
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    write: vi.fn().mockResolvedValue(undefined),
  },
})

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock document.createElement for download link
const mockClick = vi.fn()
const originalCreateElement = document.createElement.bind(document)
document.createElement = vi.fn((tagName: string) => {
  const element = originalCreateElement(tagName)
  if (tagName === 'a') {
    element.click = mockClick
  }
  return element
})

const mockFeedItem: FeedItem = {
  id: '123',
  author: {
    uid: 'user123',
    name: '测试用户',
    avatarHd: 'https://example.com/avatar.jpg',
    followerCount: 1000,
    isFollowing: false,
    description: '测试描述',
    profileUrl: 'https://weibo.com/u/user123',
  },
  createdAt: '2024-01-01T00:00:00Z',
  text: '测试微博内容',
  source: 'iPhone客户端',
  region: '北京',
  attitudesCount: 10,
  commentsCount: 5,
  repostsCount: 3,
  isLiked: false,
  picIds: [],
  picInfos: {},
}

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('GenImageDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog when open with feed item', () => {
    renderWithQueryClient(
      <GenImageDialog open={true} onOpenChange={() => {}} item={mockFeedItem} />,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('生成图片')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    renderWithQueryClient(
      <GenImageDialog open={false} onOpenChange={() => {}} item={mockFeedItem} />,
    )

    const dialog = screen.queryByRole('dialog')
    expect(dialog).not.toBeInTheDocument()
  })

  it('renders feed item content in preview', () => {
    renderWithQueryClient(
      <GenImageDialog open={true} onOpenChange={() => {}} item={mockFeedItem} />,
    )

    expect(screen.getByText('测试用户')).toBeInTheDocument()
    expect(screen.getByText('测试微博内容')).toBeInTheDocument()
  })

  it('shows copy and save buttons', () => {
    renderWithQueryClient(
      <GenImageDialog open={true} onOpenChange={() => {}} item={mockFeedItem} />,
    )

    expect(screen.getByText('复制图片')).toBeInTheDocument()
    expect(screen.getByText('保存图片')).toBeInTheDocument()
  })

  it('calls onOpenChange when dialog is closed', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()

    renderWithQueryClient(
      <GenImageDialog open={true} onOpenChange={onOpenChange} item={mockFeedItem} />,
    )

    // Find close button by looking for buttons and filtering
    const buttons = screen.getAllByRole('button')
    const closeButton = buttons.find((btn) => btn.getAttribute('aria-label') === 'Close')

    if (closeButton) {
      await user.click(closeButton)
      expect(onOpenChange).toHaveBeenCalledWith(false)
    }
  })

  it('does not render without feed item', () => {
    renderWithQueryClient(<GenImageDialog open={true} onOpenChange={() => {}} item={null} />)

    const dialog = screen.queryByRole('dialog')
    expect(dialog).not.toBeInTheDocument()
  })
})
