// Local
import * as selectors from 'app/state/selectors/index.js';
import {
    fetchAccount,
    fetchSubscriptionsForAccount,
    submitPromoterScore,
    fetchServiceAccess,
} from 'shared/api/index.js';
import actions from './actions.js';

// Operations

/**
 * A function that fetches information for a single account.
 * @param  {string}   accountGUID   GUID for that account that should be returned.
 * @return {dict}                   If there are no errors, the account is loaded into app state.
 *                                  If there is an error fetching the account, no account is loaded
 *                                  into state and a dictionary containing the error information is
 *                                  loaded into app state.
 */
const loadAccount = (accountGUID) => async (dispatch) => {
    dispatch(actions.fetchingAccount());
    try {
        const account = await fetchAccount(accountGUID);
        dispatch(actions.receivedAccount(account));

        const serviceAccessToken = await fetchServiceAccess();
        dispatch(actions.receivedServiceAccessToken(serviceAccessToken));
    } catch (error) {
        dispatch(actions.failedAccountFetch(error));
    }
};

/**
 * A function that fetches VideoDownloadSubscriptions and or a Facebook Ad Dashboard Url for an account.
 * @param  {string}   accountGUID   GUID for that account that should be returned.
 * @return {dict}                   If there are no errors, the subscriptions are loaded into app
 *                                  state.
 *                                  If there is an error fetching the subscriptions, no
 *                                  subscriptions are loaded into state and a dictionary containing
 *                                  the error information is loaded into app state.
 */
/**
 * TODO: We should check our store state to see whether we need this before hitting the server.
 */
const loadAccountSubscriptions = (accountGUID) => async (dispatch) => {
    if (!accountGUID) {
        console.warn('Cannot fetch account subscriptions without an account guid.');
        return;
    }

    dispatch(actions.fetchingAccountSubscriptions());
    try {
        const subscriptions = await fetchSubscriptionsForAccount(accountGUID);
        dispatch(actions.receivedAccountSubscriptions(subscriptions));
    } catch (error) {
        dispatch(actions.failedAccountSubscriptionsFetch());
    }
};

/**
 * Submits a promoter score response for the current user so we can record it in the database
 *
 * @param {number}  promoterScore   Number between 0-10 that user selected on promoter score feedback form
 * @param {string}  [feedback]      Optional feedback for low scores
 */
const submitUserPromoterScore = (promoterScore, feedback) => async (dispatch, getState) => {
    const accountGUID = selectors.getAccountGUID(getState());

    try {
        await submitPromoterScore(accountGUID, promoterScore, feedback);
    } catch (error) {
        console.error(error);
    }
};

export default {
    loadAccount,
    loadAccountSubscriptions,
    submitUserPromoterScore,
};