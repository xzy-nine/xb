import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MweiboCaptchaPrompt } from '@/lib/weibo/components/mweibo-captcha-prompt'

describe('MweiboCaptchaPrompt', () => {
  afterEach(cleanup)

  it('renders an explanation and a link to m.weibo.cn', () => {
    render(<MweiboCaptchaPrompt onRetry={vi.fn()} />)

    expect(screen.getByText('需要人机验证')).toBeInTheDocument()
    expect(screen.getByText(/触发了人机验证/)).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /前往 m\.weibo\.cn 完成验证/ })
    expect(link).toHaveAttribute('href', 'https://m.weibo.cn/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('calls onRetry when the retry button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()

    render(<MweiboCaptchaPrompt onRetry={onRetry} />)

    await user.click(screen.getByRole('button', { name: '验证后重新加载' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
