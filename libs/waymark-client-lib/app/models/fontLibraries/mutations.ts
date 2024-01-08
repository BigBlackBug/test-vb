import { gql } from '@apollo/client';

import { apolloClient } from 'shared/api/graphql';
import { GraphQLNode } from 'shared/types';
import {
  evictFromApolloCache,
  createOrUpdateApolloCacheFragmentEdges,
  createOrUpdateApolloCacheQueryEdges,
} from 'shared/utils/apollo';

import {
  fontLibrariesForAccountQuery,
  fontLibrariesForBusinessQuery,
  fontLibraryFields,
  fontLibraryFontFieldsFragment,
  FontLibraryFontNode,
  FontLibraryNode,
} from './queries';
import { getFontLibraryDataFromNode } from './utils';

const GET_OR_CREATE_DEFAULT_ACCOUNT_FONT_LIBRARY_MUTATION = gql`
  ${fontLibraryFields}

  mutation GetOrCreateDefaultAccountFontLibrary(
    $input: GetOrCreateDefaultAccountFontLibraryMutationInput!
  ) {
    getOrCreateDefaultAccountFontLibrary(input: $input) {
      fontLibrary {
        ...FontLibraryFields
      }
    }
  }
`;

/**
 * Mutation gets/creates a default AccountFontLibrary + FontLibrary for the given account
 *
 * @param {string} accountGUID  GUID of the account to get/create a font library for
 */
export async function getOrCreateDefaultAccountFontLibrary(accountGUID: string) {
  const mutationResult = await apolloClient.mutate<{
    getOrCreateDefaultAccountFontLibrary: {
      fontLibrary: FontLibraryNode;
    };
  }>({
    mutation: GET_OR_CREATE_DEFAULT_ACCOUNT_FONT_LIBRARY_MUTATION,
    variables: {
      input: {
        accountGuid: accountGUID,
      },
    },
    update: (cache, { data }) => {
      if (!data?.getOrCreateDefaultAccountFontLibrary) {
        return;
      }

      const { fontLibrary: createdOrUpdatedFontLibrary } =
        data.getOrCreateDefaultAccountFontLibrary;

      // Make sure font libraries for this account are updated in the cache since we just added a new one
      createOrUpdateApolloCacheQueryEdges(cache, createdOrUpdatedFontLibrary, {
        query: fontLibrariesForAccountQuery,
        variables: {
          accountGUID,
        },
        edgesDotPath: 'accountByGuid.fontLibraries.edges',
        edgeTypeName: 'FontLibraryNodeEdge',
      });
    },
  });

  if (!mutationResult.data?.getOrCreateDefaultAccountFontLibrary) {
    return null;
  }

  // Format and return the newly created/updated font library's data
  return getFontLibraryDataFromNode(
    mutationResult.data.getOrCreateDefaultAccountFontLibrary.fontLibrary,
  );
}

const GET_OR_CREATE_DEFAULT_BUSINESS_FONT_LIBRARY_MUTATION = gql`
  ${fontLibraryFields}

  mutation GetOrCreateDefaultBusinessFontLibrary(
    $input: GetOrCreateDefaultBusinessFontLibraryMutationInput!
  ) {
    getOrCreateDefaultBusinessFontLibrary(input: $input) {
      fontLibrary {
        ...FontLibraryFields
      }
    }
  }
`;

/**
 * Mutation gets/creates a default BusinessFontLibrary + FontLibrary for the given business
 *
 * @param {string} businessGUID   GUID of the business to get/create a font library for
 */
export async function getOrCreateDefaultBusinessFontLibrary(businessGUID: string) {
  const mutationResult = await apolloClient.mutate<{
    getOrCreateDefaultBusinessFontLibrary: {
      fontLibrary: FontLibraryNode;
    };
  }>({
    mutation: GET_OR_CREATE_DEFAULT_BUSINESS_FONT_LIBRARY_MUTATION,
    variables: {
      input: {
        businessGuid: businessGUID,
      },
    },
    update: (cache, { data }) => {
      if (!data?.getOrCreateDefaultBusinessFontLibrary) {
        return;
      }

      const { fontLibrary: createdOrUpdatedFontLibrary } =
        data.getOrCreateDefaultBusinessFontLibrary;

      // Make sure font libraries for this business are updated in the cache since we just added a new one
      createOrUpdateApolloCacheQueryEdges(cache, createdOrUpdatedFontLibrary, {
        query: fontLibrariesForBusinessQuery,
        variables: {
          businessGUID,
        },
        edgesDotPath: 'businessByGuid.fontLibraries.edges',
        edgeTypeName: 'FontLibraryNodeEdge',
      });
    },
  });

  if (!mutationResult.data?.getOrCreateDefaultBusinessFontLibrary) {
    return null;
  }

  // Format and return the newly created/updated font library's data
  return getFontLibraryDataFromNode(
    mutationResult.data.getOrCreateDefaultBusinessFontLibrary.fontLibrary,
  );
}

const ADD_FONT_TO_FONT_LIBRARY_MUTATION = gql`
  ${fontLibraryFontFieldsFragment}

  mutation AddFontToFontLibrary($input: AddFontToFontLibraryMutationInput!) {
    addFontToFontLibrary(input: $input) {
      createdFontLibraryFont {
        ...FontLibraryFontFields
      }
      updatedFontLibrary {
        id
      }
    }
  }
`;

/**
 * Mutation adds a font to a font library
 *
 * @param {string} fontLibraryGUID        GUID for the FontLibrary which we want to update
 * @param {string} fontBfsUUID            BFS UUID identifying the TemplateFont which we want to add to the library
 * @param {string} [fontDisplayName='']   Optional display name to apply to font if font family name is not sufficient
 */
export const addFontToFontLibrary = async (
  fontLibraryGUID: string,
  fontBfsUUID: string,
  fontDisplayName = '',
) => {
  const mutationResult = await apolloClient.mutate<{
    addFontToFontLibrary: {
      createdFontLibraryFont: FontLibraryFontNode;
      updatedFontLibrary: GraphQLNode;
    };
  }>({
    mutation: ADD_FONT_TO_FONT_LIBRARY_MUTATION,
    variables: {
      input: {
        fontLibraryGuid: fontLibraryGUID,
        fontBfsUuid: fontBfsUUID,
        displayName: fontDisplayName,
      },
    },
    update: (cache, { data }) => {
      if (!data?.addFontToFontLibrary) {
        return;
      }

      const { createdFontLibraryFont, updatedFontLibrary } = data.addFontToFontLibrary;

      const updatedFontLibraryCacheId = cache.identify(updatedFontLibrary);

      if (updatedFontLibraryCacheId) {
        // Patch the newly created font into the apollo cache entry for the font library that we updated
        createOrUpdateApolloCacheFragmentEdges(cache, createdFontLibraryFont, {
          fragment: fontLibraryFields,
          fragmentName: 'FontLibraryFields',
          fragmentCacheID: updatedFontLibraryCacheId,
          edgesDotPath: 'fonts.edges',
          edgeTypeName: 'FontLibraryFontNodeEdge',
        });
      }
    },
  });

  return mutationResult.data?.addFontToFontLibrary;
};

const REMOVE_FONT_FROM_FONT_LIBRARY_MUTATION = gql`
  mutation RemoveFontFromFontLibrary($input: RemoveFontFromFontLibraryMutationInput!) {
    removeFontFromFontLibrary(input: $input) {
      removedFontLibraryFontId
    }
  }
`;

/**
 * Mutation removes a font from a font library
 *
 * @param {string} fontLibraryGUID    GUID for the FontLibrary which we want to update
 * @param {string} fontBfsUUID        BFS UUID identifying the TemplateFont which we want to remove fron the library
 */
export const removeFontFromFontLibrary = async (fontLibraryGUID: string, fontBfsUUID: string) => {
  const mutationResult = await apolloClient.mutate<{
    removeFontFromFontLibrary: {
      removedFontLibraryFontId: string;
    };
  }>({
    mutation: REMOVE_FONT_FROM_FONT_LIBRARY_MUTATION,
    variables: {
      input: {
        fontLibraryGuid: fontLibraryGUID,
        fontBfsUuid: fontBfsUUID,
      },
    },
    update: (cache, { data }) => {
      const removedFontLibraryFontId = data?.removeFontFromFontLibrary?.removedFontLibraryFontId;

      if (removedFontLibraryFontId) {
        // Purge the removed FontLibraryFont from the apollo cache
        evictFromApolloCache(cache, {
          __typename: 'FontLibraryFontNode',
          id: removedFontLibraryFontId,
        });
      }
    },
  });

  return mutationResult?.data?.removeFontFromFontLibrary ?? null;
};
