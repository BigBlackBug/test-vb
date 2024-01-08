// Local
import {
    getAccountGUID
} from 'app/state/ducks/accounts/selectors.js';
import {
    getBestEmailAddress
} from 'app/state/selectors/contactInfo.js';

/**
 * Returns the full user information needed to determine feature flag audiences
 * for determining if a feature flag is on or off.
 *
 * Currently designed around Optimizely but pretty generic nonetheless.
 *
 * @param  {Object} state
 * @return {Object} The user information used to determine feature flag status.
 */
/* eslint-disable-next-line import/prefer-default-export */
export const getFeatureFlagUserData = (state) => {
    const info = {
        // Use a user key of 'none' if there isn't one. The Python SDK doesn't really care, but
        // the JavaScript SDK does. This way both server and client will use the same key if the
        // user isn't logged in.
        id: getAccountGUID(state) || 'none',
        attributes: {},
    };

    const email = getBestEmailAddress(state);

    if (email) {
        info.attributes.email = email;
    }

    return info;
};