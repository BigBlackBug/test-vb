// Local
import {
    getAccountEmail
} from 'app/state/ducks/accounts/selectors.js';
import {
    getAnonymousUserEmail
} from 'app/state/ducks/shop/selectors.js';

/**
 * Returns the best email address based on what we know about the current user.
 * @param  {Object} state
 * @return {string} Email address or ''
 */
/* eslint-disable-next-line import/prefer-default-export */
export const getBestEmailAddress = (state) =>
    getAccountEmail(state) || getAnonymousUserEmail(state);