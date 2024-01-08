// Vendor
import { useQuery } from '@apollo/client';
import { useCallback, useMemo, useRef } from 'react';

// Local
import {
  lastEditedUserVideoInfoQuery,
  LastEditedUserVideoInfoQueryResult,
  userVideoRendersQuery,
  UserVideoRendersQueryResult,
} from './queries';
import { getAccountPageUserVideosFromQueryData } from './utils/accountPageUserVideo';
import { getUserVideoRenderDataFromQueryData } from './utils/userVideoRenderData';
import {
  PurchasedUserVideoFilters,
  PurchasedUserVideoFilterValue,
  DraftUserVideoFilterValue,
  DraftUserVideoFilters,
} from './types';
import {
  accountPageUserVideosQuery,
  AccountPageUserVideosQueryResult,
  AccountPageUserVideosQueryArgs,
} from 'shared/api/graphql/userVideos/queries';

const FETCH_USER_VIDEOS_BATCH_SIZE = 20;

/**
 * Maps all available sorting options for user videos on the account page to the
 * orderBy params that we will need to pass to the GraphQL query.
 */
const ACCOUNT_PAGE_VIDEO_SORT_FILTERS: {
  [key in PurchasedUserVideoFilterValue | DraftUserVideoFilterValue]: Array<string>;
} = {
  lastEditedDateAsc: ['last_edited_by_user'],
  lastEditedDateDesc: ['-last_edited_by_user'],
  purchasedDateAsc: ['purchased_at'],
  purchasedDateDesc: ['-purchased_at'],
  nameAsc: ['title'],
  nameDesc: ['-title'],
  createdDateAsc: ['created_at'],
  createdDateDesc: ['-created_at'],
  hasVoiceOver: [
    // Sort videos with VO first
    'voice_over_product',
    // Sort videos with delivered VO before those in progress
    '-voice_over_product__is_delivered',
    // Then sort videos by how recently their VO status was updated
    '-voice_over_product__updated_at',
    // Then sort everything by most recent edited date
    '-last_edited_by_user',
  ],
};

/**
 * Generic hook fetches account user videos from the GraphQL API
 * and returns them in a format that can be used by the account page, along with
 * some additional useful data and callbacks.
 *
 * @param {string} accountGUID - GUID of the account to fetch videos for
 * @param {boolean} areVideosPurchased - Whether we should fetch either purchased or unpurchased (draft) videos
 * @param {string[]} orderBy - Array of strings that specify how to the videos should be ordered for the query
 */
function useAccountPageUserVideos(
  accountGUID: string,
  areVideosPurchased: boolean,
  orderBy: Array<string>,
  searchQuery = '',
) {
  const {
    data,
    previousData,
    loading: isLoading,
    error,
    fetchMore,
    refetch,
  } = useQuery<AccountPageUserVideosQueryResult, AccountPageUserVideosQueryArgs>(
    accountPageUserVideosQuery,
    {
      variables: {
        accountGUID,
        first: FETCH_USER_VIDEOS_BATCH_SIZE,
        after: undefined,
        orderBy,
        isPurchased: areVideosPurchased,
        searchQuery,
      },
      skip: !accountGUID,
      // The first time that this hook is run, make sure we call out to the server to ensure
      // our data is in sync with what's in the DB
      fetchPolicy: 'cache-and-network',
      // On subsequent re-runs of this hook, prefer to use data in the apollo cache
      nextFetchPolicy: 'cache-first',
    },
  );

  // If the query is loading and we have previous data, let's
  // fall back to that so the UI doesn't flash an empty state as the user
  // types a search query.
  const shouldUsePreviousData = isLoading && !data;
  const queryData = shouldUsePreviousData ? previousData : data;

  // Keep track of a unique ID for the current query data
  // which we will use to apply transitions in the UI when new data is loaded
  const currentFetchingQueryID = `${accountGUID}:${orderBy.join('-')}:${searchQuery}`;

  // Keep a ref for the query ID of the data which has been most recently fetched and
  // is being displayed in the UI.
  const fetchedQueryIDRef = useRef<string | null>(null);

  // If we have loaded new data for a new query ID, update the ref.
  if (!shouldUsePreviousData) {
    fetchedQueryIDRef.current = currentFetchingQueryID;
  }

  // Format the data into an array of AccountPageUserVideo objects
  const userVideos = useMemo(
    () => getAccountPageUserVideosFromQueryData(queryData?.accountByGuid.userVideos),
    [queryData],
  );

  // The total un-paginated number of draft videos that belong to the account
  const totalCount = queryData?.accountByGuid?.unfilteredUserVideos.totalCount ?? 0;
  // The total un-paginated number of draft videos that match the current search query
  const filteredTotalCount = queryData?.accountByGuid?.userVideos.totalCount ?? 0;

  const hasVideosToFetch = filteredTotalCount > userVideos.length;

  const userVideoEdges = queryData?.accountByGuid?.userVideos.edges;
  const lastUserVideoCursor =
    userVideoEdges && userVideoEdges.length > 0
      ? userVideoEdges[userVideoEdges.length - 1].cursor
      : null;

  /**
   * Fetches another batch of videos for pagination
   */
  const loadMore = useCallback(async () => {
    // If we've loaded all available videos, don't fetch more
    if (!hasVideosToFetch || !lastUserVideoCursor) {
      return null;
    }

    return fetchMore({
      variables: {
        // Fetch another batch starting from the last one that we currently have loaded
        after: lastUserVideoCursor,
      },
    });
  }, [lastUserVideoCursor, hasVideosToFetch, fetchMore]);

  return {
    queryID: fetchedQueryIDRef.current,
    userVideos,
    totalCount,
    filteredTotalCount,
    isLoading,
    error,
    loadMore,
    refetch,
  };
}

/**
 * Fetches all un-purchased draft user videos that belong to the given account.
 *
 * @param {string} accountGUID - GUID identifying the account to fetch videos for.
 * @param {DraftUserVideoFilterValue} selectedSortFilter - An enum value representing which filter we should apply to sort the videos.
 */
export function useAccountPageDraftUserVideos(
  accountGUID: string,
  selectedSortFilter: DraftUserVideoFilterValue = DraftUserVideoFilters.LastEditedDateDesc,
  searchQuery = '',
) {
  return useAccountPageUserVideos(
    accountGUID,
    // Fetch only unpurchased videos
    false,
    ACCOUNT_PAGE_VIDEO_SORT_FILTERS[selectedSortFilter],
    searchQuery,
  );
}

/**
 * Fetches all purchased user videos that belong to the given account.
 *
 * @param {string} accountGUID - GUID identifying the account to fetch videos for.
 * @param {PurchasedUserVideoFilterValue} selectedSortFilter - An enum value representing which filter we should apply to sort the videos.
 */
export function useAccountPagePurchasedUserVideos(
  accountGUID: string,
  selectedSortFilter: PurchasedUserVideoFilterValue = PurchasedUserVideoFilters.PurchasedDateDesc,
  searchQuery = '',
) {
  return useAccountPageUserVideos(
    accountGUID,
    // Fetch only purchased videos
    true,
    ACCOUNT_PAGE_VIDEO_SORT_FILTERS[selectedSortFilter],
    searchQuery,
  );
}

/**
 * Fetches barebones info on the user's most recently edited video and returns
 * whether that video is purchased or not. This determines whether we default to
 * having the "Draft videos" or "Completed videos" section expanded;
 * we always want to have the section with the most recently relevant video expanded first.
 *
 * Note that we're doing this rather than just using the two query hooks above and comparing which is more recent
 * from those because those queries are paginated and can be sorted on things other than last edited date,
 * meaning we might not always be able to guarantee that we know which section actually contains
 * the most recently edited video.
 *
 * @param {string} accountGUID
 */
export function useIsLastEditedVideoPurchased(accountGUID: string) {
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery<LastEditedUserVideoInfoQueryResult>(lastEditedUserVideoInfoQuery, {
    variables: {
      accountGUID,
    },
    skip: !accountGUID,
    // The first time that this hook is run, make sure we call out to the server to ensure
    // our data is in sync with what's in the DB
    fetchPolicy: 'cache-and-network',
    // On subsequent re-runs of this hook, prefer to use data in the apollo cache
    nextFetchPolicy: 'cache-first',
  });

  const isLastEditedUserVideoPurchased = useMemo(() => {
    const mostRecentPurchasedVideo = data?.accountByGuid?.lastPurchasedUserVideo.edges[0]?.node;
    const mostRecentEditedVideo = data?.accountByGuid?.lastEditedUserVideo.edges[0]?.node;

    if (!mostRecentPurchasedVideo || !mostRecentEditedVideo) {
      return false;
    }

    // Return true if the most recently purchased video was purchased more recently than the
    // most recently edited video was edited last
    return (
      new Date(mostRecentPurchasedVideo.purchasedAt) >
      new Date(mostRecentEditedVideo.lastEditedByUser)
    );
  }, [data]);

  return {
    isLastEditedUserVideoPurchased,
    isLoading,
    error,
  };
}

/**
 * Fetches rendered video info for a user video which will be used in the
 * VideoDownloadModal component.
 *
 * @param {string} userVideoGUID
 */
export function useUserVideoRenders(userVideoGUID: string) {
  const {
    data,
    loading: isLoading,
    refetch,
    error,
  } = useQuery<UserVideoRendersQueryResult>(userVideoRendersQuery, {
    variables: {
      userVideoGUID,
    },
    skip: !userVideoGUID,
    // The first time that this hook is run, make sure we call out to the server to ensure
    // our data is in sync with what's in the DB
    fetchPolicy: 'cache-and-network',
    // On subsequent re-runs of this hook, prefer to use data in the apollo cache
    nextFetchPolicy: 'cache-first',
  });

  const renderData = useMemo(() => getUserVideoRenderDataFromQueryData(data), [data]);

  return {
    renderData,
    refetch,
    isLoading,
    error,
  };
}
