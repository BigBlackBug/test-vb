import { gql } from '@apollo/client';

import { apolloClient } from 'shared/api/graphql';
import { GraphQLNode } from 'shared/types';
import {
  evictFromApolloCache,
  createOrUpdateApolloCacheFragmentEdges,
  createOrUpdateApolloCacheQueryEdges,
} from 'shared/utils/apollo';

import {
  colorFields,
  colorLibraryFields,
  accountColorLibrariesQuery,
  businessColorLibrariesQuery,
  ColorLibraryColorNode,
  ColorLibraryNode,
} from './queries';

// Mutation to get/create a default color library for an account
const GET_OR_CREATE_ACCOUNT_COLOR_LIBRARY_MUTATION = gql`
  ${colorLibraryFields}

  mutation GetOrCreateAccountColorLibrary($input: GetOrCreateAccountColorLibraryMutationInput!) {
    getOrCreateAccountColorLibrary(input: $input) {
      colorLibrary {
        ...ColorLibraryFields
      }
    }
  }
`;

/**
 * Performs a mutation to get or create a default color library for an account
 *
 * @param {string} accountGUID   The guid of the account to get or create a default color library for
 */
export async function getOrCreateDefaultAccountColorLibrary(accountGUID: string) {
  const mutationResult = await apolloClient.mutate<{
    getOrCreateAccountColorLibrary: {
      colorLibrary: ColorLibraryNode;
    };
  }>({
    mutation: GET_OR_CREATE_ACCOUNT_COLOR_LIBRARY_MUTATION,
    variables: {
      input: {
        accountGuid: accountGUID,
      },
    },
    update: (cache, { data }) => {
      if (!data) {
        return;
      }

      const { colorLibrary: createdOrUpdatedColorLibrary } = data.getOrCreateAccountColorLibrary;

      // Make sure color libraries for this account are updated in the cache since we just added a new one
      createOrUpdateApolloCacheQueryEdges(cache, createdOrUpdatedColorLibrary, {
        query: accountColorLibrariesQuery,
        variables: {
          accountGUID,
        },
        edgesDotPath: 'accountByGuid.colorLibraries.edges',
        edgeTypeName: 'ColorLibraryNodeEdge',
      });
    },
  });

  return mutationResult.data?.getOrCreateAccountColorLibrary ?? null;
}

// Mutation to use to get/create a default color library for a business
const GET_OR_CREATE_BUSINESS_COLOR_LIBRARY_MUTATION = gql`
  ${colorLibraryFields}

  mutation GetOrCreateBusinessColorLibrary($input: GetOrCreateBusinessColorLibraryMutationInput!) {
    getOrCreateBusinessColorLibrary(input: $input) {
      colorLibrary {
        ...ColorLibraryFields
      }
    }
  }
`;

/**
 * Performs a mutation to get or create a default color library for a business
 *
 * @param {string} businessGUID   The guid of the business to get or create a default color library for
 */
export async function getOrCreateDefaultBusinessColorLibrary(businessGUID: string) {
  const mutationResult = await apolloClient.mutate<{
    getOrCreateBusinessColorLibrary: {
      colorLibrary: ColorLibraryNode;
    };
  }>({
    mutation: GET_OR_CREATE_BUSINESS_COLOR_LIBRARY_MUTATION,
    variables: {
      input: {
        businessGuid: businessGUID,
      },
    },
    update: (cache, { data }) => {
      if (!data) {
        return;
      }

      const { colorLibrary: createdOrUpdatedColorLibrary } = data.getOrCreateBusinessColorLibrary;

      // Make sure color libraries for this business are updated in the cache since we just added a new one
      createOrUpdateApolloCacheQueryEdges(cache, createdOrUpdatedColorLibrary, {
        query: businessColorLibrariesQuery,
        variables: {
          businessGUID,
        },
        edgesDotPath: 'businessByGuid.colorLibraries.edges',
        edgeTypeName: 'ColorLibraryNodeEdge',
      });
    },
  });

  return mutationResult.data?.getOrCreateBusinessColorLibrary ?? null;
}

// Mutation to use to add/update a color in a color library when we have a library guid to use directly
const UPDATE_OR_ADD_COLOR_TO_COLOR_LIBRARY_MUTATION = gql`
  ${colorFields}

  mutation UpdateOrCreateColorLibraryColor($input: UpdateOrCreateColorLibraryColorMutationInput!) {
    updateOrCreateColorLibraryColor(input: $input) {
      color {
        ...ColorFields
      }
      updatedColorLibrary {
        id
      }
    }
  }
`;

/**
 * Performs a mutation to update or add a hex color to a color library
 *
 * @param {string} colorLibraryGuid   The guid of the color library to add the color to
 * @param {string} hexColor   The hex color to add to the color library
 */
export async function updateOrAddColorToColorLibrary(colorLibraryGUID: string, hexCode: string) {
  const mutationResult = await apolloClient.mutate<{
    updateOrCreateColorLibraryColor: {
      color: ColorLibraryColorNode;
      updatedColorLibrary: GraphQLNode;
    };
  }>({
    mutation: UPDATE_OR_ADD_COLOR_TO_COLOR_LIBRARY_MUTATION,
    variables: {
      input: {
        hexCode,
        libraryGuid: colorLibraryGUID,
      },
    },
    update: (cache, { data }) => {
      if (!data) {
        return;
      }

      const { color, updatedColorLibrary } = data.updateOrCreateColorLibraryColor;

      const colorLibraryCacheId = cache.identify(updatedColorLibrary);

      if (colorLibraryCacheId) {
        // Patch the newly created color into the apollo cache entry for the color library that we updated
        createOrUpdateApolloCacheFragmentEdges(cache, color, {
          fragment: colorLibraryFields,
          fragmentName: 'ColorLibraryFields',
          fragmentCacheID: colorLibraryCacheId,
          edgesDotPath: 'colors.edges',
          edgeTypeName: 'ColorLibraryColorNodeEdge',
        });
      }
    },
  });

  return mutationResult.data?.updateOrCreateColorLibraryColor ?? null;
}

const DELETE_COLOR_MUTATION = gql`
  mutation DeleteColorLibraryColor($input: DeleteColorLibraryColorMutationInput!) {
    deleteColorLibraryColor(input: $input) {
      removedColorId
    }
  }
`;

/**
 * Performs a mutation to delete a color from a ColorLibrary
 *
 * @param {string} colorLibraryGUID   The guid of the color library to delete the color from
 * @param {string} hexCodeToRemove    The hex code of the color to delete
 */
export async function deleteColorFromColorLibrary(
  colorLibraryGUID: string,
  hexCodeToRemove: string,
) {
  const mutationResult = await apolloClient.mutate<{
    deleteColorLibraryColor: {
      removedColorId: string;
    };
  }>({
    mutation: DELETE_COLOR_MUTATION,
    variables: {
      input: {
        hexCode: hexCodeToRemove,
        libraryGuid: colorLibraryGUID,
      },
    },
    update: (cache, { data }) => {
      if (!data) {
        return;
      }

      const { removedColorId } = data.deleteColorLibraryColor;

      if (removedColorId) {
        // Purge the removed color from the apollo cache
        evictFromApolloCache(cache, {
          __typename: 'ColorLibraryColorNode',
          id: removedColorId,
        });
      }
    },
  });

  return mutationResult.data?.deleteColorLibraryColor;
}
