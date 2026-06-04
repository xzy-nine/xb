import JSZip from 'jszip'

import type { FeedItem } from '@/lib/weibo/models/feed'

export interface MediaUrl {
  url: string
  filename: string
  type: 'image' | 'video'
}

/**
 * 从 URL 推断文件扩展名
 */
export function inferExtension(url: string): string {
  const match = url.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov)(\?|$)/i)
  if (match) {
    return match[1].toLowerCase()
  }
  // 默认根据类型推断
  return url.includes('video') || url.includes('.mp4') ? 'mp4' : 'jpg'
}

/**
 * 生成安全的文件名
 */
function sanitizeFilename(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // 移除 HTML 标签
    .replace(/[<>:"/\\|?*\n\r]/g, '') // 移除特殊字符
    .replace(/\s+/g, '_') // 空格替换为下划线
    .trim()
}

/**
 * 生成文件名：{作者名}_{微博前10字}_{序号}.{扩展名}
 */
function generateFilename(author: string, text: string, index: number, url: string): string {
  const cleanAuthor = sanitizeFilename(author)
  const cleanText = sanitizeFilename(text)
  const truncated = cleanText.slice(0, 10) || 'untitled'
  const ext = inferExtension(url)
  return `${cleanAuthor}_${truncated}_${index}.${ext}`
}

/**
 * 从 FeedItem 提取所有媒体 URL（仅当前层级）
 */
export function extractMediaUrls(item: FeedItem): MediaUrl[] {
  const urls: MediaUrl[] = []
  const author = item.author.name
  const text = item.text
  let index = 1

  // 1. 处理静态图片和 Live Photo
  for (const image of item.images) {
    // 静态图片
    urls.push({
      url: image.largeUrl,
      filename: generateFilename(author, text, index++, image.largeUrl),
      type: 'image',
    })

    // Live Photo 视频
    if (image.livePhotoVideoUrl) {
      urls.push({
        url: image.livePhotoVideoUrl,
        filename: generateFilename(author, text, index++, image.livePhotoVideoUrl),
        type: 'video',
      })
    }
  }

  // 2. 处理单视频
  if (item.media) {
    const videoUrl = item.media.downloadUrl || item.media.streamUrl
    urls.push({
      url: videoUrl,
      filename: generateFilename(author, text, index++, videoUrl),
      type: 'video',
    })
  }

  // 3. 处理混合媒体
  if (item.mixMediaInfo) {
    for (const mixItem of item.mixMediaInfo) {
      if (mixItem.type === 'pic' && mixItem.image) {
        urls.push({
          url: mixItem.image.largeUrl,
          filename: generateFilename(author, text, index++, mixItem.image.largeUrl),
          type: 'image',
        })

        // 混合媒体中的 Live Photo
        if (mixItem.image.livePhotoVideoUrl) {
          urls.push({
            url: mixItem.image.livePhotoVideoUrl,
            filename: generateFilename(author, text, index++, mixItem.image.livePhotoVideoUrl),
            type: 'video',
          })
        }
      } else if (mixItem.type === 'video') {
        const videoUrl = mixItem.videoDownloadUrl || mixItem.videoStreamUrl
        if (videoUrl) {
          urls.push({
            url: videoUrl,
            filename: generateFilename(author, text, index++, videoUrl),
            type: 'video',
          })
        }
      }
    }
  }

  return urls
}

/**
 * 预估总大小（HEAD 请求）
 */
export async function estimateTotalSize(urls: MediaUrl[]): Promise<number> {
  const sizes = await Promise.all(
    urls.map(async (mediaUrl) => {
      try {
        const response = await fetch(mediaUrl.url, { method: 'HEAD' })
        return Number.parseInt(response.headers.get('content-length') || '0', 10)
      } catch {
        return 0
      }
    }),
  )
  return sizes.reduce((sum, size) => sum + size, 0)
}

/**
 * 并发下载（限制并发数）
 */
async function downloadWithConcurrency(
  urls: MediaUrl[],
  limit: number,
): Promise<Array<{ url: MediaUrl; result: PromiseSettledResult<Blob> }>> {
  const results: Array<{ url: MediaUrl; result: PromiseSettledResult<Blob> }> = []

  for (let i = 0; i < urls.length; i += limit) {
    const batch = urls.slice(i, i + limit)
    const batchResults = await Promise.allSettled(
      batch.map((mediaUrl) =>
        fetch(mediaUrl.url).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.blob()
        }),
      ),
    )

    for (let j = 0; j < batch.length; j++) {
      results.push({
        url: batch[j],
        result: batchResults[j],
      })
    }
  }

  return results
}

/**
 * 下载并打包为 zip
 */
export async function downloadAsZip(urls: MediaUrl[], zipFilename: string): Promise<void> {
  if (urls.length === 0) {
    throw new Error('没有可下载的媒体资源')
  }

  const zip = new JSZip()

  // 并发下载（最多 5 个并发）
  const results = await downloadWithConcurrency(urls, 5)

  let successCount = 0
  let failCount = 0

  for (const { url, result } of results) {
    if (result.status === 'fulfilled') {
      zip.file(url.filename, result.value)
      successCount++
    } else {
      failCount++
      console.error(`下载失败: ${url.url}`, result.reason)
    }
  }

  if (successCount === 0) {
    throw new Error('所有资源下载失败')
  }

  // 生成 zip
  const content = await zip.generateAsync({ type: 'blob' })

  // 触发浏览器下载
  const link = document.createElement('a')
  link.href = URL.createObjectURL(content)
  link.download = zipFilename
  link.click()
  URL.revokeObjectURL(link.href)

  return Promise.resolve()
}
