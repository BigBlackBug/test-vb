import { gql } from '@apollo/client';

import { GraphQLNode } from 'shared/types';
import { RenderedVideoStatus, RenderedVideoFormat } from './types';

export const lastEditedUserVideoInfoQueryName = 'MostRecentlyEditedUserVideoInfo';

export const lastEditedUserVideoInfoQuery = gql`
  query ${lastEditedUserVideoInfoQueryName}($accountGUID: String!) {
    accountByGuid(guid: $accountGUID) {
      id
      lastEditedUserVideo: userVideos(first: 1, orderBy: "-last_edited_by_user") {
        edges {
          node {
            id
            guid
            lastEditedByUser
          }
        }
      }
      lastPurchasedUserVideo: userVideos(first: 1, orderBy: "-purchased_at") {
        edges {
          node {
            id
            guid
            purchasedAt
          }
        }
      }
    }
  }
`;
export interface LastEditedUserVideoInfoQueryResult {
  accountByGuid: {
    id: string;
    lastEditedUserVideo: {
      edges: Array<{
        node: {
          id: string;
          guid: string;
          lastEditedByUser: string;
          purchasedAt: string;
        };
      }>;
    };
    lastPurchasedUserVideo: {
      edges: Array<{
        node: {
          id: string;
          guid: string;
          lastEditedByUser: string;
          purchasedAt: string;
        };
      }>;
    };
  };
}

const userVideoRenderedVideoFragment = gql`
  fragment UserVideoRenderedVideo on RenderedVideoNode {
    id
    renderUrl
    renderFormat
    renderStatus
    renderSize
    hasWatermark
  }
`;
export interface RenderedVideoNode extends GraphQLNode {
  renderUrl: string;
  renderFormat: RenderedVideoFormat;
  renderStatus: RenderedVideoStatus;
  renderSize: number;
  hasWatermark: boolean;
}

export const userVideoRendersQueryName = 'UserVideoRenders';
export const userVideoRendersQuery = gql`
  ${userVideoRenderedVideoFragment}

  query ${userVideoRendersQueryName}($userVideoGUID: String!) {
    userVideoByGuid(guid: $userVideoGUID) {
      id
      guid
      currentConfiguredVideo {
        id
        renderStatus
        renderedVideos {
          edges {
            node {
              ...UserVideoRenderedVideo
            }
          }
        }
      }
    }
  }
`;
export interface UserVideoRendersQueryResult {
  userVideoByGuid: {
    id: string;
    guid: string;
    currentConfiguredVideo: null | {
      id: string;
      renderedVideos: {
        edges: Array<{
          node: RenderedVideoNode;
        }>;
      };
    };
  };
}
