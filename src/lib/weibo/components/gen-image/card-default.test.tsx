import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CardDefault } from './card-default'
import type { ShareCardData } from './types'

vi.mock('@/assets/icons/weibo.svg', () => ({
  default: 'weibo-logo.svg',
}))

vi.mock('@/lib/weibo/components/status-text', () => ({
  StatusText: ({ text }: { text: string }) => <span>{text}</span>,
}))

const baseCardData: ShareCardData = {
  author: {
    id: 'user-1',
    name: '主微博作者',
    avatarUrl: null,
  },
  text: '主微博内容',
  images: [],
  videoCoverUrl: null,
  stats: {
    likes: 1,
    comments: 2,
    reposts: 3,
  },
  createdAt: '2024-01-01T00:00:00Z',
  createdAtLabel: '刚刚',
  mblogId: 'MainMblogId',
  source: 'Web',
  regionName: '北京',
}

describe('CardDefault', () => {
  it('applies full image layout to images inside retweeted status', () => {
    const { container } = render(
      <CardDefault
        data={{
          ...baseCardData,
          retweetedStatus: {
            ...baseCardData,
            author: {
              id: 'user-2',
              name: '转发微博作者',
              avatarUrl: null,
            },
            text: '转发微博内容',
            images: [
              {
                id: 'retweeted-image',
                thumbnailUrl: 'https://example.com/retweeted-thumb.jpg',
                largeUrl: 'https://example.com/retweeted-large.jpg',
              },
            ],
          },
        }}
        showFullImages
      />,
    )

    const image = container.querySelector('img[src="https://example.com/retweeted-large.jpg"]')

    expect(image).toHaveAttribute('src', 'https://example.com/retweeted-large.jpg')
    expect(image).toHaveClass('object-contain')
    expect(image).not.toHaveClass('aspect-square')
  })

  it('hides stats for both status and retweeted status when stats are disabled', () => {
    const { queryByText } = render(
      <CardDefault
        data={{
          ...baseCardData,
          stats: {
            likes: 701,
            comments: 702,
            reposts: 703,
          },
          retweetedStatus: {
            ...baseCardData,
            author: {
              id: 'user-2',
              name: '转发微博作者',
              avatarUrl: null,
            },
            text: '转发微博内容',
            stats: {
              likes: 901,
              comments: 902,
              reposts: 903,
            },
          },
        }}
        showStats={false}
      />,
    )

    expect(queryByText('701')).not.toBeInTheDocument()
    expect(queryByText('702')).not.toBeInTheDocument()
    expect(queryByText('703')).not.toBeInTheDocument()
    expect(queryByText('901')).not.toBeInTheDocument()
    expect(queryByText('902')).not.toBeInTheDocument()
    expect(queryByText('903')).not.toBeInTheDocument()
  })

  it('keeps the status link visible when stats are disabled', () => {
    const { getByText, queryByText } = render(
      <CardDefault data={baseCardData} showStats={false} showLink />,
    )

    expect(getByText('https://weibo.com/user-1/MainMblogId')).toBeInTheDocument()
    expect(queryByText('1')).not.toBeInTheDocument()
    expect(queryByText('2')).not.toBeInTheDocument()
    expect(queryByText('3')).not.toBeInTheDocument()
  })
})
