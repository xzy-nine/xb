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

// Note: status.ts and comments.ts will be added in the next phase
// export { toFeedItem, mergeLongTextIntoFeedItem } from './status'
// export { toCommentItem } from './comments'
