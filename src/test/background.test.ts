import { describe, expect, it } from 'vitest'

import { assertAllowedMweiboFetchUrl, createMediaRequestHeaderRule } from '@/entrypoints/background'
import { buildTopicSearchUrl } from '@/lib/weibo/services/m-weibo-client'

describe('background media request header rule', () => {
  it('only matches background fetch requests for media downloads', () => {
    const rule = createMediaRequestHeaderRule()

    expect(rule.condition.resourceTypes).toEqual(['xmlhttprequest'])
    expect(rule.condition.tabIds).toEqual([-1])
    expect(rule.condition.resourceTypes).not.toContain('media')
    expect(rule.condition.resourceTypes).not.toContain('image')
  })
})

describe('m.weibo fetch allowlist', () => {
  it('allows the unread reminders endpoint', () => {
    expect(() => {
      assertAllowedMweiboFetchUrl('https://m.weibo.cn/api/remind/unread')
    }).not.toThrow()
  })

  it('allows topic search URLs built by the m.weibo client', () => {
    expect(() => {
      assertAllowedMweiboFetchUrl(buildTopicSearchUrl('测试', 1))
    }).not.toThrow()
  })

  it('rejects non-HTTPS URLs', () => {
    expect(() => {
      assertAllowedMweiboFetchUrl('http://m.weibo.cn/api/remind/unread')
    }).toThrow('unsupported-mweibo-url')
  })

  it('rejects other hosts', () => {
    expect(() => {
      assertAllowedMweiboFetchUrl('https://weibo.com/api/remind/unread')
    }).toThrow('unsupported-mweibo-url')
  })

  it('rejects unrelated m.weibo.cn paths', () => {
    expect(() => {
      assertAllowedMweiboFetchUrl('https://m.weibo.cn/api/config')
    }).toThrow('unsupported-mweibo-endpoint')
  })
})
