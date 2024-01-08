import { gql } from '@apollo/client';
import { UserVideoApprovalNode, UserVideoNode } from '@libs/graphql-types';

const coreUserVideoFragmentName = 'CoreUserVideoFragment' as const;

const coreUserVideoFragment = gql`
  fragment ${coreUserVideoFragmentName} on UserVideoNode {
    id
    guid
    title
    createdAt
    updatedAt
    purchasedAt
    lastEditedByUser
    lastEditableDate
    business {
      id
      guid
      businessName
    }
    videoTemplateVariant {
      id
      guid
      displayName
      displayDuration
      width
      height
      videoTemplate {
        id
        isWaymarkAuthorTemplate
      }
    }
  }
`;

export type CoreUserVideo = Pick<
  Required<UserVideoNode>,
  | '__typename'
  | 'id'
  | 'guid'
  | 'title'
  | 'createdAt'
  | 'updatedAt'
  | 'purchasedAt'
  | 'lastEditedByUser'
  | 'lastEditableDate'
> & {
  business: Pick<
    NonNullable<UserVideoNode['business']>,
    'id' | '__typename' | 'guid' | 'businessName'
  >;
  videoTemplateVariant: Pick<
    UserVideoNode['videoTemplateVariant'],
    'id' | '__typename' | 'guid' | 'displayName' | 'displayDuration' | 'width' | 'height'
  > & {
    videoTemplate: Pick<
      UserVideoNode['videoTemplateVariant']['videoTemplate'],
      'id' | '__typename' | 'isWaymarkAuthorTemplate'
    >;
  };
};

const userVideoApprovalsFragmentName = 'UserVideoApprovalsFragment' as const;
const userVideoApprovalsFragment = gql`
  fragment ${userVideoApprovalsFragmentName} on UserVideoApprovalNode {
    id
    guid
    createdAt
    fullName
    approvedAt
  }
`;

export type UserVideoApproval = Pick<
  UserVideoApprovalNode,
  '__typename' | 'id' | 'guid' | 'createdAt' | 'fullName' | 'approvedAt'
>;

const userVideoAccountPageFieldsFragmentName = 'UserVideoAccountPageFieldsFragment' as const;

const userVideoAccountPageFieldsFragment = gql`
  ${userVideoApprovalsFragment}

  fragment ${userVideoAccountPageFieldsFragmentName} on UserVideoNode {
    id
    currentConfiguredVideo {
      id
      thumbnailUrl
    }
    purchaseApproval {
      id
      guid
      createdAt
      approvedAt
    }
    userVideoApprovals {
      ...${userVideoApprovalsFragmentName}
    }
    voiceOverProduct {
      id
      isDelivered
    }
  }
`;

export type UserVideoAccountPageFields = Pick<UserVideoNode, '__typename' | 'id'> & {
  currentConfiguredVideo: Pick<
    NonNullable<UserVideoNode['currentConfiguredVideo']>,
    '__typename' | 'id' | 'thumbnailUrl'
  >;
  purchaseApproval: Pick<
    NonNullable<UserVideoNode['purchaseApproval']>,
    '__typename' | 'id' | 'guid' | 'createdAt' | 'approvedAt'
  >;
  userVideoApprovals: Array<
    Pick<
      NonNullable<NonNullable<UserVideoNode['userVideoApprovals']>[number]>,
      '__typename' | 'id' | 'guid' | 'createdAt' | 'fullName' | 'approvedAt'
    >
  >;
  voiceOverProduct: Pick<
    NonNullable<UserVideoNode['voiceOverProduct']>,
    '__typename' | 'id' | 'isDelivered'
  >;
};

const userVideoRendersFragmentName = 'UserVideoRendersFragment' as const;
const userVideoRendersFragment = gql`
  fragment ${userVideoRendersFragmentName} on UserVideoNode {
    id
    currentConfiguredVideo {
      id
      guid
      renderStatus
      thumbnailUrl
      renderedVideos {
        edges {
          node {
            id
            guid
            renderUrl
            renderFormat
            renderStatus
            renderSize
            hasWatermark
          }
        }
      }
    }
  }
`;

export type UserVideoRenderedVideoFields = Pick<UserVideoNode, '__typename' | 'id'> & {
  currentConfiguredVideo: Pick<
    NonNullable<UserVideoNode['currentConfiguredVideo']>,
    '__typename' | 'id' | 'guid' | 'renderStatus' | 'thumbnailUrl'
  > & {
    renderedVideos: {
      edges: Array<{
        __typename: NonNullable<
          NonNullable<UserVideoNode['currentConfiguredVideo']>['renderedVideos']['edges'][number]
        >['__typename'];
        node: Pick<
          NonNullable<
            NonNullable<
              NonNullable<
                UserVideoNode['currentConfiguredVideo']
              >['renderedVideos']['edges'][number]
            >['node']
          >,
          | '__typename'
          | 'id'
          | 'guid'
          | 'renderedAt'
          | 'renderUrl'
          | 'renderFormat'
          | 'renderStatus'
          | 'renderSize'
          | 'hasWatermark'
        > & {
          renderFormat: 'email' | 'broadcast_quality' | 'preview';
          renderStatus: 'initial' | 'in_progress' | 'succeeded' | 'failed' | 'aborted';
        };
      }>;
    };
  };
};

export const userVideoFragments = {
  core: {
    name: coreUserVideoFragmentName,
    fragment: coreUserVideoFragment,
  },
  accountPageFields: {
    name: userVideoAccountPageFieldsFragmentName,
    fragment: userVideoAccountPageFieldsFragment,
  },
  userVideoApprovals: {
    name: userVideoApprovalsFragmentName,
    fragment: userVideoApprovalsFragment,
  },
  userVideoRenders: {
    name: userVideoRendersFragmentName,
    fragment: userVideoRendersFragment,
  },
} as const;
