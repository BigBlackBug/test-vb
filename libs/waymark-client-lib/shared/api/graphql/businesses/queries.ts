import { DocumentNode, FetchPolicy, gql, useQuery } from '@apollo/client';
import { useSelector } from 'react-redux';

import * as selectors from 'app/state/selectors/index.js';

import { CoreBusinessDetails, businessFragments } from './fragments';
import { apolloClient } from '@libs/waymark-client-lib/admin/api';
import { useEffect, useMemo } from 'react';
import { subscribeToBusinessCacheUpdates } from './cache';

/** businessByGuid query */
export const BUSINESS_DETAILS_BY_GUID_QUERY = gql`
  ${businessFragments.coreBusinessDetails.fragment}

  query BusinessDetailsByGUID($businessGUID: String!) {
    businessByGuid(guid: $businessGUID) {
      ...${businessFragments.coreBusinessDetails.name}
    }
  }
`;

interface BusinessDetailsByGUIDQueryResult {
  businessByGuid: CoreBusinessDetails;
}

interface BusinessDetailsByGUIDQueryArgs {
  businessGUID: string | null;
}

/**
 * Hook fetches and returns data on the Business record for a given GUID
 */
export const useBusinessDetailsByBusinessGUID = (
  businessGUID: string | null,
  fetchPolicy: FetchPolicy = 'cache-first',
) => {
  const { data, loading, refetch, error } = useQuery<
    BusinessDetailsByGUIDQueryResult,
    BusinessDetailsByGUIDQueryArgs
  >(BUSINESS_DETAILS_BY_GUID_QUERY, {
    variables: {
      businessGUID,
    },
    fetchPolicy,
    skip: !businessGUID,
  });

  useEffect(
    // Set up subscriptions to keep the cache up to date with any changes to the business
    () => (businessGUID ? subscribeToBusinessCacheUpdates(businessGUID) : undefined),
    [businessGUID],
  );

  return {
    businessDetails: data?.businessByGuid,
    isLoading: loading,
    refetch,
    error,
  };
};

/** Directly query for business details */
export const getBusinessDetailsByGUID = async (
  businessGUID: string | null,
  fetchPolicy: FetchPolicy = 'cache-first',
) =>
  businessGUID
    ? apolloClient.query<BusinessDetailsByGUIDQueryResult, BusinessDetailsByGUIDQueryArgs>({
        query: BUSINESS_DETAILS_BY_GUID_QUERY,
        variables: {
          businessGUID,
        },
        fetchPolicy,
      })
    : null;
/** end businessByGuid query */

/** accountByGuid -> businesses query */
export const listAllBusinessProfilesForAccountQueryName = 'ListAllBusinessProfilesForAccount';
export const listAllBusinessProfilesForAccountQuery = gql`
  ${businessFragments.coreBusinessDetails.fragment}

  query ${listAllBusinessProfilesForAccountQueryName}($accountGUID: String!, $orderBy: [String]) {
    accountByGuid(guid: $accountGUID) {
      id
      businesses(orderBy: $orderBy) {
        edges {
          node {
            ...${businessFragments.coreBusinessDetails.name}
          }
        }
      }
    }
  }
`;

export interface AllBusinessesForAccountQueryResult {
  accountByGuid: {
    businesses: {
      edges: Array<{
        node: CoreBusinessDetails;
        __typename: 'BusinessRelayNodeEdge';
      }>;
    };
  };
}

interface AllBusinessesForAccountQueryArgs {
  accountGUID: string;
  orderBy?: string[];
}

/**
 * Hook fetches and returns a list of all Business records tied to the currently
 * logged-in account.
 */
export const useAllBusinessesForAccount = () => {
  const accountGUID = useSelector(selectors.getAccountGUID);

  const {
    data,
    loading: isLoading,
    error,
    refetch: refetchBusinessesForAccount,
  } = useQuery<AllBusinessesForAccountQueryResult, AllBusinessesForAccountQueryArgs>(
    listAllBusinessProfilesForAccountQuery,
    {
      variables: {
        accountGUID,
        orderBy: ['-created_at'],
      },
      skip: !accountGUID,
    },
  );

  const businesses = useMemo(
    () => data?.accountByGuid?.businesses.edges.map(({ node }) => node) ?? [],
    [data?.accountByGuid?.businesses.edges],
  );

  return {
    businesses,
    isLoading,
    refetchBusinessesForAccount,
    error,
  };
};

/**
 * Construct a valid refetchQuery object to requery a field on a business
 * @param {string} businessGUID   GUID of business to fetch data for
 * @param {string[]} queryFields   Name of field to query
 * @param {DocumentNode} [fragment]  Optional fragment to include in query
 */
export const getBusinessRefetchQuery = (
  businessGUID: string,
  queryFields: string[],
  fragment: DocumentNode | string = '',
) => ({
  query: gql`
    ${fragment}
    query BusinessDetailsByGUID($businessGUID: String!) {
      businessByGuid(guid: $businessGUID) {
        id
        guid
        ${queryFields.join('\n')}
      }
    }
  `,
  variables: {
    businessGUID,
  },
});
