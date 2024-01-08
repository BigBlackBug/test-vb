import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { gql } from '@apollo/client';

import {
  CreateBusinessMutationInput,
  DeleteBusinessMutationInput,
  DeleteBusinessMutationPayload,
  UpdateBusinessMutationInput,
} from '@libs/graphql-types';

import { evictFromApolloCache } from 'shared/utils/apollo';
import * as selectors from 'app/state/selectors/index.js';

import { apolloClient } from '../index';
import { CoreBusinessDetails, businessFragments, businessRelayNodeTypeName } from './fragments';
import {
  AllBusinessesForAccountQueryResult,
  listAllBusinessProfilesForAccountQuery,
} from './queries';

/** createBusiness mutation */
const CreateBusinessMutation = gql`
  ${businessFragments.coreBusinessDetails.fragment}

  mutation CreateBusiness($input: CreateBusinessMutationInput!) {
    createBusiness(input: $input) {
      createdBusiness {
        ...${businessFragments.coreBusinessDetails.name}
      }
    }
  }
`;

type CreateBusinessMutationVariables = {
  input: CreateBusinessMutationInput;
};
type CreateBusinessMutationResult = {
  createBusiness: {
    createdBusiness: CoreBusinessDetails;
  };
};

export const createBusiness = async (input: CreateBusinessMutationInput) => {
  const createBusinessResult = await apolloClient.mutate<
    CreateBusinessMutationResult,
    CreateBusinessMutationVariables
  >({
    mutation: CreateBusinessMutation,
    variables: {
      input,
    },
  });

  // Note that we should usually avoid directly modifying the Apollo cache in favor of just invalidating + refetching data
  // except as a last resort for performance. In this case, businesses aren't created very often so it would probably be a better move
  // to just invalidate and refetch for simplicity, but manually patching the cache is already working here so we'll just keep it as is
  const createdBusiness = createBusinessResult.data?.createBusiness?.createdBusiness;
  if (createdBusiness) {
    // If we successfully created a business, patch it into the cache
    apolloClient.cache.updateQuery<AllBusinessesForAccountQueryResult>(
      {
        query: listAllBusinessProfilesForAccountQuery,
        // NOTE: these variables need to exactly match the variables used in the useAllBusinessesForAccount hook in order
        // to work as expected.
        variables: {
          accountGUID: input.accountGuid,
          orderBy: ['-created_at'],
        },
      },
      (cachedData) =>
        cachedData
          ? {
              ...cachedData,
              accountByGuid: {
                ...cachedData.accountByGuid,
                businesses: {
                  ...cachedData.accountByGuid.businesses,
                  edges: [
                    {
                      node: createdBusiness,
                      __typename: 'BusinessRelayNodeEdge',
                    },
                    ...cachedData.accountByGuid.businesses.edges,
                  ],
                },
              },
            }
          : cachedData,
    );
  }

  return createBusinessResult;
};

export const useCreateBusinessForLoggedInAccount = () => {
  const accountGUID = useSelector(selectors.getAccountGUID);

  return useCallback(
    (createBusinessMutationInputVariables: Omit<CreateBusinessMutationInput, 'accountGuid'> = {}) =>
      createBusiness({
        accountGuid: accountGUID,
        ...createBusinessMutationInputVariables,
      }),
    [accountGUID],
  );
};
/** end createBusiness mutation */

/** updateBusiness mutation */
const UpdateBusinessMutation = gql`
  ${businessFragments.coreBusinessDetails.fragment}

  mutation UpdateBusiness($input: UpdateBusinessMutationInput!) {
    updateBusiness(input: $input) {
      updatedBusiness {
        ...${businessFragments.coreBusinessDetails.name}
      }
    }
  }
`;

interface UpdateBusinessMutationVariables {
  input: UpdateBusinessMutationInput;
}
interface UpdateBusinessMutationResult {
  updateBusiness: {
    updatedBusiness: CoreBusinessDetails;
  };
}

/**
 * Mutation updates a business record
 */
export const updateBusiness = (input: UpdateBusinessMutationInput) =>
  apolloClient.mutate<UpdateBusinessMutationResult, UpdateBusinessMutationVariables>({
    mutation: UpdateBusinessMutation,
    variables: {
      input,
    },
  });
/** end updateBusiness mutation */

/** deleteBusiness mutation */
const DELETE_BUSINESS_MUTATION = gql`
  mutation DeleteBusiness($input: DeleteBusinessMutationInput!) {
    deleteBusiness(input: $input) {
      deletedBusinessId
    }
  }
`;

interface DeleteBusinessMutationVariables {
  input: DeleteBusinessMutationInput;
}

interface DeleteBusinessMutationResult {
  deleteBusiness: DeleteBusinessMutationPayload;
}

/**
 * Mutation deletes a business by GUID
 */
export const deleteBusiness = (businessGUID: string) =>
  apolloClient.mutate<DeleteBusinessMutationResult, DeleteBusinessMutationVariables>({
    mutation: DELETE_BUSINESS_MUTATION,
    variables: {
      input: {
        guid: businessGUID,
      },
    },
    update(cache, _, { variables }) {
      if (!variables) {
        return;
      }

      const {
        input: { guid: businessGUID },
      } = variables;

      // Evict the deleted business from the Apollo cache
      if (businessGUID) {
        evictFromApolloCache(cache, {
          guid: businessGUID,
          __typename: businessRelayNodeTypeName,
        });
      }
    },
  });
/** end deleteBusiness mutation */
