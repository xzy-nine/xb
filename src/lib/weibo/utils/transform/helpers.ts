/**
 * Helper utilities for Weibo data transformation.
 */

import type { FeedEmoticon } from '@/lib/weibo/models/feed'

/**
 * Strips query string from URL.
 */
export function stripUrlQuery(url: string | null | undefined): string | null {
  if (!url) return null
  return url.split('?')[0] ?? null
}

/**
 * Strips HTML tags from text.
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '')
}

/**
 * Normalizes markdown text by trimming whitespace.
 */
export function normalizeMarkdownText(value: string | undefined): string {
  if (!value) return ''
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

/**
 * Decodes HTML entities in text.
 */
export function decodeHtmlEntities(value: string) {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = value
  return textarea.value
}

/**
 * Extracts emoticons from HTML text.
 */
export function extractEmoticonsFromHtml(html: string | undefined): Record<string, FeedEmoticon> {
  if (!html) return {}

  const emoticonMap: Record<string, FeedEmoticon> = {}
  const imgRegex = /<img[^>]+alt="([^"]+)"[^>]+src="([^"]+)"[^>]*>/g

  let match: RegExpExecArray | null
  while ((match = imgRegex.exec(html)) !== null) {
    const alt = match[1]
    const src = match[2]
    if (alt && src) {
      emoticonMap[alt] = {
        phrase: alt,
        url: src.startsWith('//') ? `https:${src}` : src,
      }
    }
  }

  return emoticonMap
}

/**
 * Removes duplicate items from array based on key function.
 */
export function uniqueBy<T>(items: T[], keyFor: (item: T) => string) {
  const seen = new Set<string>()
  const result: T[] = []

  for (const item of items) {
    const key = keyFor(item)
    if (!seen.has(key)) {
      seen.add(key)
      result.push(item)
    }
  }

  return result
}

/**
 * Picks non-empty URL from value.
 */
export function pickNonEmptyUrl(value?: string | null): string | undefined {
  return value && value.trim() !== '' ? value : undefined
}

/**
 * Gets unique non-empty URLs from array.
 */
export function uniqueNonEmptyUrls(urls: Array<string | null | undefined>): string[] {
  return [...new Set(urls.filter((url): url is string => Boolean(url?.trim())))]
}

/**
 * Strips entity tokens from text (e.g., image short URLs).
 */
export function stripEntityTokens(text: string, tokens: string[]) {
  let result = text
  for (const token of tokens) {
    if (token) {
      result = result.replaceAll(token, '')
    }
  }
  return result.trim()
}
