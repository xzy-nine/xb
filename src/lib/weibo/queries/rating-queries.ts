import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  batchGetUserRatingSummaries,
  getMyUserRating,
  getUserRatingSummary,
  rateUser,
} from '@/lib/weibo/services/xb-server-client'

const RATING_SUMMARY_STALE_TIME = 60 * 60 * 1000

// ─── Query key factories ───

export function userRatingQueryKey(uid: string) {
  return ['rating', 'user', uid] as const
}

export function myUserRatingQueryKey(uid: string) {
  return ['rating', 'user', uid, 'me'] as const
}

export function batchRatingQueryKey(uids: string[]) {
  return ['rating', 'batch', ...uids.sort()] as const
}

// ─── Query options ───

export function userRatingQueryOptions(uid: string) {
  return {
    queryKey: userRatingQueryKey(uid),
    queryFn: () => getUserRatingSummary(uid),
    staleTime: RATING_SUMMARY_STALE_TIME,
    enabled: uid !== '',
  }
}

export function myUserRatingQueryOptions(uid: string) {
  return {
    queryKey: myUserRatingQueryKey(uid),
    queryFn: () => getMyUserRating(uid),
    staleTime: Number.POSITIVE_INFINITY,
    enabled: uid !== '',
  }
}

export function batchRatingQueryOptions(uids: string[]) {
  return {
    queryKey: batchRatingQueryKey(uids),
    queryFn: () => batchGetUserRatingSummaries(uids),
    staleTime: RATING_SUMMARY_STALE_TIME,
    enabled: uids.length > 0,
  }
}

// ─── Mutations ───

export function useRateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ targetUid, stars }: { targetUid: string; stars: number }) =>
      rateUser({ target_uid: targetUid, stars }),
    onMutate: async ({ targetUid, stars }) => {
      await queryClient.cancelQueries({ queryKey: myUserRatingQueryKey(targetUid) })
      const prevMyRating = queryClient.getQueryData<{ stars: number | null }>(
        myUserRatingQueryKey(targetUid),
      )

      queryClient.setQueryData(myUserRatingQueryKey(targetUid), { stars })

      return { prevMyRating, targetUid }
    },
    onError: (_err, { targetUid }, context) => {
      if (context?.prevMyRating !== undefined) {
        queryClient.setQueryData(myUserRatingQueryKey(targetUid), context.prevMyRating)
        return
      }

      queryClient.removeQueries({ queryKey: myUserRatingQueryKey(targetUid), exact: true })
    },
    onSuccess: (_data, { targetUid }) => {
      void queryClient.invalidateQueries({ queryKey: myUserRatingQueryKey(targetUid) })
    },
  })
}
