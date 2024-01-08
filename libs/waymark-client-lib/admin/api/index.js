// Vendor
import {
    ApolloClient,
    createHttpLink,
    InMemoryCache
} from '@apollo/client';
// This is part of the @apollo/client import and the check is incorrectly failing.
// eslint-disable-next-line import/no-extraneous-dependencies
import {
    setContext
} from '@apollo/client/link/context';

// Local
import {
    getCSRFHeader
} from 'shared/api/core/base.js';

export * from './templates.js';
export * from './videoLibraries.js';

/**
 * The GraphQL client. This wrapper allows GraphQL calls to work within the Django
 * CSRF framework.
 */
const httpLink = createHttpLink({
    uri: '/api/v4/query/',
});

const authLink = setContext((_, {
    headers
}) => ({
    ...headers,
    // Set the 'X-CSRFToken' header to the csrftoken
    headers: getCSRFHeader(),
}));

export const apolloClient = new ApolloClient({
    link: authLink.concat(httpLink),
    // Tell Apollo to include credentials for CSRF token protection.
    credentials: 'same-origin',
    cache: new InMemoryCache(),
});