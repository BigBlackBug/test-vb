// Local
import {
    LOGIN_ACTION_ADD,
    LOGIN_ACTION_CLEAR
} from '../../actionTypes.js';

/**
 * @typedef {Object} ActionConfig
 *          A configuration object for defined actions to execute on successful signup / login.
 * @property {string} ActionConfig.name
 *          Name of the action
 * @property {array} ActionConfig.args
 *          List of arguments needed for the corresponding operation.
 * @property {(string|Object)} ActionConfig.nextURL
 *          Destination to navigate the user after the action is completed.
 *          URL path string *or* location-like object with { pathname, search, hash, state }
 */

// `loginActions` reducer -- stores information about actions that need to occur once
// a user has logged in (signed up or logged in).
// TODO: for the time being, we're only gsoing to support storing a single action
// until we find a use case where we'd need to store multiple things for one user.
const DEFAULT_STATE = {
    action: {
        /* See `ActionConfig` structure above. */
    },
};

export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case LOGIN_ACTION_ADD:
            return {
                ...state,
                action: action.payload,
            };

        case LOGIN_ACTION_CLEAR:
            return DEFAULT_STATE;

        default:
            return state;
    }
};