import { FetchPolicy, gql } from '@apollo/client';
import { AccountRelayNode } from '@libs/graphql-types';

import {
  CoreUserVideo,
  UserVideoAccountPageFields,
  UserVideoRenderedVideoFields,
  userVideoFragments,
} from './fragments';
import { apolloClient } from '..';

export const accountPageUserVideosQueryName = 'AccountPageUserVideos';
export const accountPageUserVideosQuery = gql`
  ${userVideoFragments.core.fragment}
  ${userVideoFragments.accountPageFields.fragment}

  query ${accountPageUserVideosQueryName}(
    $accountGUID: String!
    $first: Int
    $after: String
    $orderBy: [String]
    $isPurchased: Boolean
    $searchQuery: String
  ) {
    accountByGuid(guid: $accountGUID) {
      id
      unfilteredUserVideos: userVideos(isPurchased: $isPurchased) {
        totalCount
      }
      userVideos(
        first: $first
        after: $after
        orderBy: $orderBy
        isPurchased: $isPurchased
        searchQuery: $searchQuery
      ) {
        totalCount
        edges {
          cursor
          node {
            ...${userVideoFragments.core.name}
            ...${userVideoFragments.accountPageFields.name}
          }
        }
      }
    }
  }
`;

export type UnformattedAccountPageUserVideo = CoreUserVideo & UserVideoAccountPageFields;

export type AccountPageUserVideosQueryResult = {
  accountByGuid: Pick<AccountRelayNode, '__typename' | 'id'> & {
    unfilteredUserVideos: Pick<NonNullable<AccountRelayNode['userVideos']>, 'totalCount'>;
    userVideos: Pick<NonNullable<AccountRelayNode['userVideos']>, 'totalCount'> & {
      edges: Array<
        Pick<
          NonNullable<NonNullable<NonNullable<AccountRelayNode['userVideos']>['edges']>[number]>,
          'cursor'
        > & {
          node: UnformattedAccountPageUserVideo;
        }
      >;
    };
  };
};

export interface AccountPageUserVideosQueryArgs {
  accountGUID: string;
  first?: number;
  after?: string;
  orderBy?: string[];
  isPurchased?: boolean;
  searchQuery?: string;
}

export const getAccountPageUserVideosForAccount = async (
  accountGUID: string,
  fetchPolicy: FetchPolicy = 'cache-first',
) => {
  return apolloClient.query<AccountPageUserVideosQueryResult, AccountPageUserVideosQueryArgs>({
    query: accountPageUserVideosQuery,
    variables: {
      accountGUID,
    },
    fetchPolicy,
  });
};

const sdkAllAccountUserVideosQuery = gql`
  ${userVideoFragments.core.fragment}
  ${userVideoFragments.userVideoRenders.fragment}

  query SDKAllAccountUserVideos($accountGUID: String!) {
    accountByGuid(guid: $accountGUID) {
      id
      userVideos {
        edges {
          node {
            ...${userVideoFragments.core.name}
            ...${userVideoFragments.userVideoRenders.name}
          }
        }
      }
    }
  }
`;

export type SDKUserVideo = CoreUserVideo & UserVideoRenderedVideoFields;

interface SDKAllAccountUserVideosQueryResult {
  accountByGuid: {
    id: string;
    userVideos: {
      edges: Array<{
        node: SDKUserVideo;
      }>;
    };
  };
}
interface SDKAllAccountUserVideosQueryArgs {
  accountGUID: string;
}

export const getSDKUserVideosForAccount = async (
  accountGUID: string,
  fetchPolicy: FetchPolicy = 'network-only',
) => {
  return apolloClient.query<SDKAllAccountUserVideosQueryResult, SDKAllAccountUserVideosQueryArgs>({
    query: sdkAllAccountUserVideosQuery,
    variables: {
      accountGUID,
    },
    fetchPolicy,
  });
};

const sdkUserVideoByGUIDQuery = gql`
  ${userVideoFragments.core.fragment}
  ${userVideoFragments.userVideoRenders.fragment}

  query UserVideoByGUID($userVideoGUID: String!) {
    userVideoByGuid(guid: $userVideoGUID) {
      ...${userVideoFragments.core.name}
      ...${userVideoFragments.userVideoRenders.name}
    }
  }
`;

interface SDKUserVideoByGUIDQueryResult {
  userVideoByGuid: SDKUserVideo;
}
interface SDKUserVideoByGUIDQueryArgs {
  userVideoGUID: string;
}

/**
 * Directly query for a user video by GUID
 */
export const getSDKUserVideoByGUID = async (
  userVideoGUID: string,
  fetchPolicy: FetchPolicy = 'network-only',
) => {
  return apolloClient.query<SDKUserVideoByGUIDQueryResult, SDKUserVideoByGUIDQueryArgs>({
    query: sdkUserVideoByGUIDQuery,
    variables: {
      userVideoGUID,
    },
    fetchPolicy,
  });
};
