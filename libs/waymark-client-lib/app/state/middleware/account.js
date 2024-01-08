// Local
import {
    SHOP_INITIALIZE_PENDING,
    ACCOUNT_FETCH_COMPLETE,
    ACCOUNT_LOGOUT,
} from 'app/state/actionTypes.js';
import {
    apolloClient
} from 'shared/api/graphql';
import {
    sessionStorageKeys
} from 'app/constants/SessionStorage';
import {
    safeSessionStorage
} from 'shared/utils/safeStorage';
import {
    operations as accountOperations
} from 'app/state/ducks/accounts/index.js';

/**
 * Middleware for managing account-related side effects from redux actions
 */
const accountMiddleware = (store) => {
    let currentAccountGUID = null;

    /**
     * Manage any side effects that should be run when the currently logged-in account changes
     *
     * @param {string} newAccountGUID
     */
    const onAccountGuidChanged = (newAccountGUID) => {
        // If the account guid didn't change, return early
        if (currentAccountGUID === newAccountGUID) {
            return;
        }

        // Clear the apollo client's cache and force any active queries to re-fetch
        // to ensure we don't have any stale query data related to the newly logged in account
        apolloClient.resetStore();

        // Store the new account GUID
        currentAccountGUID = newAccountGUID;

        store.dispatch(accountOperations.loadAccountSubscriptions(newAccountGUID));
    };

    /**
     * Called when an account finishes fetching
     * Checks if the received account is a session override account and if so,
     * saves additional info about the account in the session storage so Webflow pages can access and use it
     *
     * @param {object} accountPayload The account that was just successfully fetched
     */
    const onStoreOverrideAccountSessionInfo = (accountPayload) => {
        const sessionAccountOverrideGUID = safeSessionStorage.getItem(
            sessionStorageKeys.adminOverrideAccountGUID,
        );

        if (
            accountPayload.guid &&
            sessionAccountOverrideGUID &&
            accountPayload.guid === sessionAccountOverrideGUID
        ) {
            // If we have an override GUID and it matches the received account GUID, let's
            // save more info about the account in our session storage so webflow pages can access it
            safeSessionStorage.setItem(
                sessionStorageKeys.adminOverrideAccountName,
                accountPayload.first_name,
            );
            safeSessionStorage.setItem(
                sessionStorageKeys.adminOverrideAccountEmail,
                accountPayload.email_address,
            );
            safeSessionStorage.setItem(
                sessionStorageKeys.adminOverrideAccountCompanyName,
                accountPayload.company_name,
            );
        }
    };

    return (next) => (action) => {
        switch (action.type) {
            case SHOP_INITIALIZE_PENDING:
                {
                    currentAccountGUID = action.payload.accountGUID;
                    break;
                }
            case ACCOUNT_FETCH_COMPLETE:
                {
                    onStoreOverrideAccountSessionInfo(action.payload);

                    onAccountGuidChanged(action.payload.guid);
                    break;
                }
            case ACCOUNT_LOGOUT:
                onAccountGuidChanged(null);
                break;

            default:
        }

        return next(action);
    };
};

export default accountMiddleware;