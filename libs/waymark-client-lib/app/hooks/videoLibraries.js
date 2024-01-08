// Vendor
import {
    gql,
    useQuery,
    useMutation
} from '@apollo/client';
import {
    useMemo
} from 'react';

// Local
import {
    coreVideoLibraryFields,
    coreVideoLibraryVideoFields,
} from 'app/constants/mediaLibraryFragments.js';
import {
    stockVideoLibraryFragment
} from 'shared/api/graphql/stockVideoLibraries/fragments';

// Shared
import {
    apolloClient
} from 'shared/api/graphql';

// GraphQL queries for different video library types
export const videoLibraryQueries = {
    account: gql `
    ${coreVideoLibraryFields}
    ${stockVideoLibraryFragment.fragment}

    query AccountVideoLibrariesDetail($accountGUID: String) {
      accountByGuid(guid: $accountGUID) {
        id

        videoLibraries {
          edges {
            node {
              ...CoreVideoLibraryFields
            }
          }
        }

        stockVideoLibraries {
          edges {
            node {
              ...${stockVideoLibraryFragment.name}
            }
          }
        }
      }
    }
  `,
    business: gql `
    ${coreVideoLibraryFields}
    ${stockVideoLibraryFragment.fragment}

    query BusinessVideoDetailsByGUID($businessGUID: String!) {
      businessByGuid(guid: $businessGUID) {
        id
        guid
        businessName

        videoLibraries {
          edges {
            node {
              ...CoreVideoLibraryFields
            }
          }
        }

        stockVideoLibraries {
          edges {
            node {
              ...${stockVideoLibraryFragment.name}
            }
          }
        }
      }
    }
  `,
};

/**
 * Parses a GraphQL response for video library data and flattens structure to remove
 * GraphQL specific keys.
 *
 * @param {Object} response    GraphQL response containing video library data
 */
const useVideoLibrariesResponse = (response) =>
    useMemo(() => {
        if (!response) {
            return {};
        }

        const userUploadLibraries = response.videoLibraries ? .edges;
        const stockVideoLibraries = response.stockVideoLibraries ? .edges;

        return {
            userUpload: userUploadLibraries.flatMap(({
                    node
                }) =>
                node.videoAssets.edges ? .map((asset) => asset.node),
            ),
            stock: stockVideoLibraries.flatMap(({
                    node
                }) =>
                node.stockVideoLibraryVideos.edges ? .map((asset) => asset.node),
            ),
        };
    }, [response]);

/**
 * Hook fetches and parses video library data for a given account
 *
 * @param {string} accountGUID    GUID of account to fetch video library data for
 */
export const useAccountVideoAssets = (accountGUID) => {
    const {
        data
    } = useQuery(videoLibraryQueries.account, {
        variables: {
            accountGUID,
        },
        skip: !accountGUID,
    });

    return useVideoLibrariesResponse(data ? .accountByGuid);
};

/**
 * Hook fetches and parses video library data for a given business
 *
 * @param {string} businessGUID    GUID of business to fetch video library data for
 */
export const useBusinessVideoAssets = (businessGUID) => {
    const {
        data
    } = useQuery(videoLibraryQueries.business, {
        variables: {
            businessGUID,
        },
        skip: !businessGUID,
    });

    return useVideoLibrariesResponse(data ? .businessByGuid);
};

// Mutations
const CREATE_ACCOUNT_LIBRARY_VIDEO_MUTATION = gql `
  ${coreVideoLibraryVideoFields}

  mutation CreateAccountVideoLibraryVideo($input: CreateAccountVideoLibraryVideoMutationInput!) {
    createAccountVideoLibraryVideo(input: $input) {
      videoLibraryVideo {
        ...CoreVideoLibraryVideoFields
      }
    }
  }
`;

/**
 * Hook returns a mutation function from Apollo which can be called to create
 * VideoAssetLibraryVideo records associated with an account.
 *
 * @returns {[(param: CreateAccountVideoLibraryVideoMutationFunctionParam) => Promise]}
 */
export const useCreateAccountLibraryVideoMutation = () =>
    useMutation(CREATE_ACCOUNT_LIBRARY_VIDEO_MUTATION);

const CREATE_BUSINESS_LIBRARY_VIDEO_MUTATION = gql `
  ${coreVideoLibraryVideoFields}

  mutation CreateBusinessVideoLibraryVideo($input: CreateBusinessVideoLibraryVideoMutationInput!) {
    createBusinessVideoLibraryVideo(input: $input) {
      videoLibraryVideo {
        ...CoreVideoLibraryVideoFields
      }
    }
  }
`;

/**
 * Hook returns a mutation function from Apollo which can be called to create
 * VideoAssetLibraryVideo records associated with a business.
 *
 * @returns {[(param: CreateBusinessVideoLibraryVideoMutationFunctionParam) => Promise]}
 */
export const useCreateBusinessLibraryVideoMutation = () =>
    useMutation(CREATE_BUSINESS_LIBRARY_VIDEO_MUTATION);

const UPDATE_LIBRARY_VIDEO_MUTATION = gql `
  ${coreVideoLibraryVideoFields}

  mutation UpdateVideoLibraryVideo($input: UpdateVideoLibraryVideoMutationInput!) {
    updateVideoLibraryVideo(input: $input) {
      updatedVideo {
        ...CoreVideoLibraryVideoFields
      }
    }
  }
`;

/**
 * Update an VideoAssetLibraryVideo record.
 *
 * @param {Object} mutationInput    Updated VideoAssetLibraryVideo data.
 */
export const updateVideoAsset = async (mutationInput, refetchQuery) =>
    apolloClient.mutate({
        mutation: UPDATE_LIBRARY_VIDEO_MUTATION,
        variables: {
            input: mutationInput,
        },
        refetchQueries: [refetchQuery],
    });