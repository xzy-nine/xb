/**
 * Main exports for Weibo data transformation.
 * Re-exports all public APIs from sub-modules.
 */

// Types
export type {
  WeiboStatusUser,
  WeiboMediaInfo,
  WeiboPageInfo,
  WeiboPicInfo,
  WeiboStatus,
  WeiboLongTextData,
} from './types'

// Media transformation
export { toMedia, toMixMediaInfo } from './media'

// Status transformation
export { toFeedItem, mergeLongTextIntoFeedItem } from './status'

// Comment transformation
export { toCommentItem } from './comments'
