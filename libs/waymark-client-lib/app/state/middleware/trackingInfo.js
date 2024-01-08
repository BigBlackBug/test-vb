import {
    ACCOUNT_FETCH_COMPLETE,
    ACCOUNT_RESET_EMAIL_COMPLETE,
    ACCOUNT_LOGOUT,
} from 'app/state/actionTypes.js';
import * as selectors from 'app/state/selectors/index.js';
import Intercom from 'shared/utils/intercom.js';

/**
 * Updates the contact info for the user registered with intercom.
 * This should be called when we load a user's account for the first time or
 * if part of their contact info is updated, ie resetting email.
 *
 * @param {object}  newContactInfo
 * @param {string}  newContactInfo.user_id  The user's account GUID, ie the id tied to this user's intercom contact record
 *                                            The user_id property must always be provided when updating the user's contact info
 * @param {string}  [newContactInfo.email]  The user's email address
 * @param {string}  [newContactInfo.name]   The user's name tied to the account
 */
const updateIntercomContact = (newContactInfo) => {
    Intercom('update', newContactInfo);
};

/**
 * Middleware for managing chat-related side effects from redux actions
 */
const trackingInfoMiddleware =
    ({
        getState
    }) =>
    (next) =>
    (action) => {
        switch (action.type) {
            case ACCOUNT_FETCH_COMPLETE:
                {
                    // When an account is successfully fetched, update the user's contact
                    // with useful info about the account
                    const {
                        email_address: accountEmail,
                        full_name: accountName,
                        guid: accountGUID,
                        partner_name: partnerName,
                    } = action.payload;

                    updateIntercomContact({
                        user_id: accountGUID,
                        email: accountEmail,
                        name: accountName,
                        partner_name: partnerName,
                    });

                    break;
                }

            case ACCOUNT_RESET_EMAIL_COMPLETE:
                {
                    // When the user resets their email, make sure we update the email associated with
                    // their intercom contact
                    const accountGUID = selectors.getAccountGUID(getState());

                    const newAccountEmail = action.payload;

                    updateIntercomContact({
                        user_id: accountGUID,
                        email: newAccountEmail
                    });

                    break;
                }

            case ACCOUNT_LOGOUT:
                // Clear intercom's session cookies now that the user is logged out
                Intercom('shutdown');

                break;

            default:
        }

        return next(action);
    };

export default trackingInfoMiddleware;