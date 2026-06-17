import { describe, expect, it } from 'vitest'

import { detectMweiboCaptcha } from '@/lib/weibo/services/m-weibo-client'
import { MweiboCaptchaError } from '@/lib/weibo/services/mweibo-errors'

describe('detectMweiboCaptcha', () => {
  it('returns the captcha URL when ok=-100 and url contains /captcha/', () => {
    expect(
      detectMweiboCaptcha({
        ok: -100,
        errno: '-100',
        msg: '',
        url: 'https://m.weibo.cn/captcha/show?backUrl=',
        extra: '',
      }),
    ).toBe('https://m.weibo.cn/captcha/show?backUrl=')
  })

  it('returns null when ok is normal (1)', () => {
    expect(detectMweiboCaptcha({ ok: 1, data: {} })).toBeNull()
  })

  it('returns null when ok is -100 but url is missing', () => {
    expect(detectMweiboCaptcha({ ok: -100, errno: '-100' })).toBeNull()
  })

  it('returns null when ok is -100 but url is not a captcha link', () => {
    expect(detectMweiboCaptcha({ ok: -100, url: 'https://m.weibo.cn/something' })).toBeNull()
  })

  it('returns null for null or non-object inputs', () => {
    expect(detectMweiboCaptcha(null)).toBeNull()
    expect(detectMweiboCaptcha('string')).toBeNull()
    expect(detectMweiboCaptcha(42)).toBeNull()
    expect(detectMweiboCaptcha(undefined)).toBeNull()
  })
})

describe('MweiboCaptchaError', () => {
  it('exposes captchaUrl, kind, and the right name', () => {
    const err = new MweiboCaptchaError('https://m.weibo.cn/captcha/show?x=1')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(MweiboCaptchaError)
    expect(err.kind).toBe('mweibo-captcha')
    expect(err.captchaUrl).toBe('https://m.weibo.cn/captcha/show?x=1')
    expect(err.name).toBe('MweiboCaptchaError')
  })
})
