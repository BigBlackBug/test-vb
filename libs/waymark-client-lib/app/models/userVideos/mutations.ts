import { gql } from '@apollo/client';

// TEMPORARY: redux imports to support keeping the redux store in sync
import store from 'app/state/store.js';
import * as selectors from 'app/state/selectors/index.js';
import userVideoActions from 'app/state/ducks/userVideos/actions.js';
// END REDUX IMPORTS

import { businessFragments, CoreBusinessDetails } from 'shared/api/graphql/businesses/fragments';
import {
  accountPageUserVideosQueryName,
  UnformattedAccountPageUserVideo,
} from 'shared/api/graphql/userVideos/queries';
import { apolloClient } from 'shared/api/graphql';
import { evictFromApolloCache } from 'shared/utils/apollo';
import { GraphQLNode } from 'shared/types';
import { lastEditedUserVideoInfoQueryName, userVideoRendersQuery } from './queries';
import { getFormattedUserVideoApprovalRequest } from './utils/userVideoApprovalRequest';
import { RenderedVideoFormat } from './types';
import { UserVideoApproval, userVideoFragments } from 'shared/api/graphql/userVideos/fragments';

interface UpdateVariables {
  title?: string;
  videoConfiguration?: Record<string, unknown>;
  businessGUID?: string;
}

/**
 * Constructs a mutation for updating a user video which only returns the fields
 * that were updated.
 *
 * @param {Object} updateVariables - The variables which will be passed to the mutation.
 */
const getUpdateUserVideoMutation = (updateVariables: UpdateVariables) => gql`
${updateVariables.businessGUID ? businessFragments.coreBusinessDetails.fragment : ''}

mutation UpdateUserVideo($input: UpdateUserVideoMutationInput!) {
    updateUserVideo(input: $input) {
      updatedUserVideo {
        id
        guid
        # Return updated values for any fields which will be updated in this mutation
        # so we can update the cache with the new values!
        ${updateVariables.title ? 'title' : ''}
        ${updateVariables.videoConfiguration ? 'videoConfiguration' : ''}
        ${
          updateVariables.businessGUID
            ? `business {
          ...${businessFragments.coreBusinessDetails.name} {
        }`
            : ''
        }
      }
    }
  }
`;
interface UpdateUserVideoMutationResult {
  updateUserVideo: {
    updatedUserVideo: GraphQLNode & {
      guid: string;
      title?: string;
      videoConfiguration?: Record<string, unknown>;
      business?: CoreBusinessDetails;
    };
  };
}

/**
 * Mutation updates a UserVideo record
 *
 * @param {string} userVideoGUID - GUIID of the UserVideo record to update
 * @param {Object} updateVariables - Object containing the fields to update
 * @param {string} [updateVariables.title] - New title for the UserVideo
 * @param {Object} [updateVariables.videoConfiguration] - New video configuration for the UserVideo
 * @param {string} [updateVariables.businessGUID] - GUID of the Business to store on the UserVideo (can also be set to null to remove an existing business)
 */
export const updateUserVideo = async (userVideoGUID: string, updateVariables: UpdateVariables) => {
  const mutationResult = await apolloClient.mutate<UpdateUserVideoMutationResult>({
    mutation: getUpdateUserVideoMutation(updateVariables),
    variables: {
      input: {
        guid: userVideoGUID,
        ...updateVariables,
      },
    },
  });

  if (mutationResult.errors) {
    throw new Error(
      `An error occurred while attempting to update user video: ${mutationResult.errors[0].message}`,
    );
  }

  // We need to make sure the redux store is synced up with the new changes we just made
  // or else it could be possible to edit a video's title on the account page,
  // then open it in the editor and see the old title.
  await store.dispatch(async (dispatch: any, getState: () => any) => {
    const currentUserVideoData = selectors.getUserVideoByGUID(getState(), userVideoGUID);

    if (!currentUserVideoData) {
      return;
    }

    const updatedUserVideoData = {
      ...currentUserVideoData,
    };

    if (updateVariables.title) {
      updatedUserVideoData.title = updateVariables.title;
    }

    if (updateVariables.videoConfiguration) {
      updatedUserVideoData.video_spec.configuration = updateVariables.videoConfiguration;
    }

    if (updateVariables.businessGUID) {
      updatedUserVideoData.business = updateVariables.businessGUID;
    }

    await dispatch(userVideoActions.updateUserVideo(updatedUserVideoData));
  });

  return mutationResult.data?.updateUserVideo?.updatedUserVideo ?? null;
};

const DELETE_USER_VIDEO_MUTATION = gql`
  mutation DeleteUserVideo($input: DeleteUserVideoMutationInput!) {
    deleteUserVideo(input: $input) {
      deletedUserVideo {
        id
        # Include guid because we use that field for user videos' cache ids
        guid
      }
    }
  }
`;
interface DeleteUserVideoMutationResult {
  deleteUserVideo: {
    deletedUserVideo: GraphQLNode & {
      guid: string;
    };
  };
}

/**
 * Deletes a UserVideo record from the user's drafts
 *
 * @param {string} userVideoGUID
 */
export const deleteUserVideo = async (userVideoGUID: string) => {
  const mutationResult = await apolloClient.mutate<DeleteUserVideoMutationResult>({
    mutation: DELETE_USER_VIDEO_MUTATION,
    variables: {
      input: {
        guid: userVideoGUID,
      },
    },
    update: (cache, { data }) => {
      // Manually updating the cache along with performing a refetch
      // so that we can reflect the deletion in the UI immediately
      // and then let the refetch get things fully in sync after the fact
      const deletedUserVideo = data?.deleteUserVideo?.deletedUserVideo;

      if (!deletedUserVideo) {
        return;
      }

      // Evict the deleted UserVideo from the apollo cache
      evictFromApolloCache(cache, deletedUserVideo);
    },
    refetchQueries: [
      // Refetch the account page user videos query so we can get the updated
      // total video count back in sync
      accountPageUserVideosQueryName,
      lastEditedUserVideoInfoQueryName,
    ],
  });

  if (mutationResult.errors) {
    throw new Error(
      `An error occurred while attempting to delete user video: ${mutationResult.errors[0].message}`,
    );
  }
};

const CREATE_USER_VIDEO_MUTATION = gql`
  mutation CreateUserVideo($input: CreateUserVideoMutationInput!) {
    createUserVideo(input: $input) {
      userVideo {
        id
        guid
      }
    }
  }
`;
interface CreateUserVideoMutationResult {
  createUserVideo: {
    userVideo: GraphQLNode & {
      guid: string;
    };
  };
}

/**
 * Makes a copy of a UserVideo record for the user's drafts
 * @param {string} copyUserVideoGUID - GUID of the video we want to copy
 * @param {string} [title] - Optional custom title for the new video
 */
export const makeUserVideoDraftCopy = async (copyUserVideoGUID: string, title?: string) => {
  const mutationResult = await apolloClient.mutate<CreateUserVideoMutationResult>({
    mutation: CREATE_USER_VIDEO_MUTATION,
    variables: {
      input: {
        copyUserVideoGuid: copyUserVideoGUID,
        title,
      },
    },
    refetchQueries: [
      // Refetch the account page user videos query so they update to reflect this new video.
      // Doing a full refetch rather than messing with patching the cache because there's too many
      // potential permutations of the accountPageUserVideosQuery (every possible sort filter gets
      // its own cache entry)
      accountPageUserVideosQueryName,
      lastEditedUserVideoInfoQueryName,
    ],
  });

  if (mutationResult.errors) {
    throw new Error(
      `An error occurred while attempting to copy video: ${mutationResult.errors[0].message}`,
    );
  }
};

const RENDER_USER_VIDEO = gql`
  ${userVideoFragments.core.fragment}
  ${userVideoFragments.accountPageFields.fragment}

  mutation RenderUserVideo($input: RenderUserVideoMutationInput!) {
    renderUserVideo(input: $input) {
      userVideo {
        ...${userVideoFragments.core.name}
        ...${userVideoFragments.accountPageFields.name}
        ...AccountPageUserVideo
      }
    }
  }
`;
interface RenderUserVideoMutationResult {
  renderUserVideo: {
    userVideo: GraphQLNode & UnformattedAccountPageUserVideo;
  };
}

/**
 * Kicks off new render(s) for a UserVideo record
 *
 * @param {string} userVideoGUID - GUID of the video we want to render
 */
export const renderUserVideo = async (
  userVideoGUID: string,
  renderFormat?: RenderedVideoFormat,
) => {
  const mutationResult = await apolloClient.mutate<RenderUserVideoMutationResult>({
    mutation: RENDER_USER_VIDEO,
    variables: {
      input: {
        guid: userVideoGUID,
        renderFormats: renderFormat ? [renderFormat] : undefined,
      },
    },
    refetchQueries: [
      // Re-fetch the list of renders for this video
      {
        query: userVideoRendersQuery,
        variables: {
          userVideoGUID,
        },
      },
    ],
  });

  if (mutationResult.errors) {
    throw new Error(
      `An error occurred while attempting to render user video: ${mutationResult.errors[0].message}`,
    );
  }
};

const CREATE_USER_VIDEO_APPROVAL_REQUEST_MUTATION = gql`
  ${userVideoFragments.userVideoApprovals.fragment}

  mutation CreateUserVideoApprovalRequest($input: CreateUserVideoApprovalRequestMutationInput!) {
    createUserVideoApprovalRequest(input: $input) {
      userVideo {
        id
        guid
        userVideoApprovals {
          ...${userVideoFragments.userVideoApprovals.name}
        }
      }
    }
  }
`;
interface CreateUserVideoApprovalRequestMutationResult {
  createUserVideoApprovalRequest: {
    userVideo: GraphQLNode & {
      guid: string;
      userVideoApprovals: Array<UserVideoApproval>;
    };
  };
}

/**
 * Creates an approval request for a video
 *s
 * @param {string} userVideoGUID
 */
export const createUserVideoApprovalRequest = async (userVideoGUID: string) => {
  const mutationResult = await apolloClient.mutate<CreateUserVideoApprovalRequestMutationResult>({
    mutation: CREATE_USER_VIDEO_APPROVAL_REQUEST_MUTATION,
    variables: {
      input: {
        userVideoGuid: userVideoGUID,
      },
    },
  });

  const formattedVideoApprovalRequest = getFormattedUserVideoApprovalRequest(
    mutationResult.data?.createUserVideoApprovalRequest?.userVideo?.userVideoApprovals ?? [],
  );

  if (!formattedVideoApprovalRequest || mutationResult.errors) {
    throw new Error(
      `An error occurred while attempting to create user video approval request${
        mutationResult.errors ? `: ${mutationResult.errors[0].message}` : ''
      }`,
    );
  }

  return formattedVideoApprovalRequest;
};

const APPROVE_USER_VIDEO_MUTATION = gql`
  ${userVideoFragments.userVideoApprovals.fragment}

  mutation ApproveUserVideo($input: UpdateUserVideoApprovalRequestMutationInput!) {
    approveUserVideo(input: $input) {
      userVideo {
        id
        guid
        userVideoApprovals {
          ...${userVideoFragments.userVideoApprovals.name}
        }
      }
    }
  }
`;
interface ApproveUserVideoMutationResult {
  approveUserVideo: {
    userVideo: GraphQLNode & {
      guid: string;
      userVideoApprovals: Array<UserVideoApproval>;
    };
  };
}

/**
 * Approves a video which has a pending approval request
 *
 * @param {string} userVideoGUID
 */
export const approveUserVideo = async (userVideoGUID: string) => {
  const mutationResult = await apolloClient.mutate<ApproveUserVideoMutationResult>({
    mutation: APPROVE_USER_VIDEO_MUTATION,
    variables: {
      input: {
        userVideoGuid: userVideoGUID,
      },
    },
  });

  const formattedVideoApprovalRequest = getFormattedUserVideoApprovalRequest(
    mutationResult.data?.approveUserVideo?.userVideo?.userVideoApprovals ?? [],
  );

  if (!formattedVideoApprovalRequest || mutationResult.errors) {
    throw new Error(
      `An error occurred while attempting to create user video approval request${
        mutationResult.errors ? `: ${mutationResult.errors[0].message}` : ''
      }`,
    );
  }

  return formattedVideoApprovalRequest;
};
