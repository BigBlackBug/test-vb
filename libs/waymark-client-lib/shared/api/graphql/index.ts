// Vendor
import { ApolloClient, createHttpLink, InMemoryCache, ApolloLink } from '@apollo/client';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { relayStylePagination } from '@apollo/client/utilities';
// This is part of the @apollo/client import and the check is incorrectly failing.
import { setContext } from '@apollo/client/link/context';

// Local
import { getCSRFHeader } from 'shared/api/core/base.js';

/**
 * The GraphQL client. This wrapper allows GraphQL calls to work within the Django
 * CSRF framework.
 */

// Batch HTTP link used for batching requests made within 10ms of each other to avoid making
// multiple calls to the server
const batchHttpLink = new BatchHttpLink({
  uri: '/api/v4/batch/',
});

// Regular HTTP link used for all other queries
const httpLink = createHttpLink({
  uri: '/api/v4/query/',
});

// Use the ApolloLink split functionality to seamlessly switch between the HTTP links
// based on the operation context
const splitLink = ApolloLink.split(
  (operation) => operation.getContext().shouldBatch,
  batchHttpLink,
  httpLink,
);

const additionalHeaders: Record<string, string> = {};

export const setAdditionalHeader = (key: string, value: string) => {
  additionalHeaders[key] = value;
};
export const removeAdditionalHeader = (key: string) => {
  delete additionalHeaders[key];
};

const authLink = setContext((_, { headers }) => ({
  ...headers,
  // Set the 'X-CSRFToken' header to the csrftoken
  headers: getCSRFHeader(),
}));

const additionalHeadersLink = setContext((_, { headers }) => {
  const newContext = {
    // Custom request headers passed in will override the additional headers that have been
    // set.
    headers: {
      ...additionalHeaders,
      ...headers,
    },
  };
  return newContext;
});

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // relayStylePagination hooks up caching to automatically merge previously fetched
        // and newly fetched paginated videoTemplateVariant data
        videoTemplateVariants: relayStylePagination([
          // Array defines args which should differentiate queries
          // so that their results aren't merged
          'groupVariant_VariantGroup_Slug',
          'displayDuration_In',
          'aspectRatio_In',
          'videoTemplate_HasFootage',
          'videoTemplate_ImageAssetCount_Lte',
          'videoTemplate_ImageAssetCount_Gte',
          'orderBy',
        ]),
      },
    },
    AccountRelayNode: {
      fields: {
        // Enable relay-style pagination for user videos queried on an account
        userVideos: relayStylePagination([
          // Query results shouldn't be merged if they have different
          // orderBy, isPurchased, or searchQuery args
          'orderBy',
          'isPurchased',
          'searchQuery',
        ]),
      },
    },
    UserVideoNode: {
      keyFields: ['guid'],
    },
    BusinessRelayNode: {
      keyFields: ['guid'],
    },
  },
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(additionalHeadersLink.concat(splitLink)),
  // Tell Apollo to include credentials for CSRF token protection.
  credentials: 'same-origin',
  cache,
});
