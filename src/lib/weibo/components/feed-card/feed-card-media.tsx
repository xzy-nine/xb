import { useCallback } from 'react'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import { browsingHistoryStore } from '@/lib/weibo/hooks/use-browsing-history'
import type { FeedItem } from '@/lib/weibo/models/feed'

import { AudioPlayerComponent } from '../media-player/audio-player'
import { LivePlayer } from '../media-player/live-player'
import { VideoPlayer } from '../media-player/video-player'
import { getMediaDownloadFilename } from './feed-card-utils'

export function FeedMediaBlock({ item }: { item: FeedItem }) {
  const addEntry = useCallback(() => {
    browsingHistoryStore.getState().addEntry(item)
  }, [item])

  if (!item.media) {
    return null
  }

  if (item.media.type === 'audio') {
    return (
      <div
        onClickCapture={(event) => {
          event.preventDefault()
        }}
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
        }}
        onMouseDown={(event) => {
          event.stopPropagation()
          event.preventDefault()
        }}
        onPointerDown={(event) => {
          event.stopPropagation()
          event.preventDefault()
        }}
      >
        <AudioPlayerComponent src={item.media.streamUrl} />
      </div>
    )
  }

  if (item.media.type === 'live') {
    return (
      <div
        onClickCapture={(event) => {
          event.preventDefault()
        }}
        onClick={(event) => {
          event.stopPropagation()
          event.preventDefault()
        }}
        onMouseDown={(event) => {
          event.stopPropagation()
          event.preventDefault()
        }}
        onPointerDown={(event) => {
          event.stopPropagation()
          event.preventDefault()
        }}
      >
        <AspectRatio
          ratio={16 / 9}
          className="overflow-hidden rounded-xl outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
        >
          <LivePlayer
            streamUrl={item.media.streamUrl}
            coverUrl={item.media.coverUrl ?? ''}
            liveStatus={item.media.liveStatus ?? 0}
            replayUrl={item.media.replayUrl}
          />
        </AspectRatio>
      </div>
    )
  }

  return (
    <div
      onClickCapture={(event) => {
        event.preventDefault()
      }}
      onClick={(event) => {
        event.stopPropagation()
        event.preventDefault()
      }}
      onMouseDown={(event) => {
        event.stopPropagation()
        event.preventDefault()
      }}
      onPointerDown={(event) => {
        event.stopPropagation()
        event.preventDefault()
      }}
      className="max-w-[650px]"
    >
      <AspectRatio
        ratio={item.media.videoOrientation === 'vertical' ? 4 / 3 : 16 / 9}
        className="overflow-hidden rounded-xl outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
      >
        <VideoPlayer
          progressiveSrc={item.media.streamUrl}
          poster={item.media.coverUrl ?? undefined}
          dash={item.media.dash}
          downloadUrl={item.media.downloadUrl}
          downloadFilename={getMediaDownloadFilename(item)}
          onPlay={addEntry}
        />
      </AspectRatio>
    </div>
  )
}
