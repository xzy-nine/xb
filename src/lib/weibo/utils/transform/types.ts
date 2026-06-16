/**
 * Shared types for Weibo API response transformation.
 * These types represent the raw Weibo API payloads.
 */

export interface WeiboStatusUser {
  avatar_hd?: string
  id?: number | string
  idstr?: string
  profile_image_url?: string
  screen_name?: string
}

export interface WeiboMediaInfo {
  video_title?: string
  video_orientation?: 'vertical' | 'horizontal'
  mp4_720p_mp4?: string
  h265_mp4_hd?: string
  mp4_hd_url?: string
  mpdInfo?: {
    mpdContent?: string
    mpdcontent?: string
  }
  playback_list?: Array<{
    meta?: {
      type?: number
      label?: string
      quality_index?: number | string
      quality_label?: string
      is_hidden?: boolean
    }
    play_info?: {
      type?: number
      url?: string
      protocol?: string
      label?: string
      mime?: string
      bandwidth?: number
      width?: number
      height?: number
    }
  }>
  object?: {
    object_id?: string
  }
  video_details?: {
    video_id_str?: string
  }
  stream?: {
    url?: string
  }
  media_info?: {
    video_playback?: Array<{
      play_info?: {
        url?: string
        width?: number
        height?: number
      }
      meta?: {
        video_duration?: number
      }
    }>
  }
}

export interface WeiboPageInfo {
  type?: string
  object_type?: number
  object_id?: string
  content1?: string
  content2?: string
  page_pic?: {
    url?: string
  }
  media_info?: WeiboMediaInfo
}

export interface WeiboPicInfo {
  large?: { url?: string }
  largest?: { url?: string }
  original?: { url?: string }
  mw2000?: { url?: string }
  thumbnail?: { url?: string }
}

export interface WeiboStatus {
  id?: number | string
  idstr?: string
  mid?: string
  mblogid?: string
  user?: WeiboStatusUser
  created_at?: string
  text?: string
  text_raw?: string
  longText?: {
    longTextContent?: string
  }
  isLongText?: boolean
  source?: string
  region_name?: string
  pic_ids?: string[]
  pic_num?: number
  pic_infos?: Record<string, WeiboPicInfo>
  mix_media_info?: {
    items?: Array<{
      type?: 'video' | 'pic' | 'live'
      data?: {
        pic_id?: string
        pic_infos?: Record<string, WeiboPicInfo>
        media_info?: WeiboMediaInfo
        stream?: { url?: string }
      }
    }>
  }
  page_info?: WeiboPageInfo
  url_struct?: Array<{
    short_url?: string
    long_url?: string
    url_title?: string
    url_type?: number
    pic_ids?: string[]
    pic_infos?: Record<string, WeiboPicInfo>
  }>
  topic_struct?: Array<{
    topic_title?: string
    topic_url?: string
  }>
  retweeted_status?: WeiboStatus
  reposts_count?: number
  comments_count?: number
  attitudes_count?: number
  favorited?: boolean
  attitudes_status?: number
  title?: {
    text?: string
  }
  reply_comment?: WeiboStatus
  comments?: WeiboStatus[]
  more_info?: {
    text?: string
  }
  like_counts?: number
  liked?: boolean
}

export interface WeiboLongTextData extends Pick<
  WeiboStatus,
  'created_at' | 'longText' | 'region_name' | 'source' | 'text' | 'url_struct' | 'topic_struct'
> {
  ok: number
}
