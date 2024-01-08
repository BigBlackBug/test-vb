// Local
import baseAPI from 'shared/api/core/base.js';
import {
    addQueryParametersToURL
} from 'shared/utils/urls.js';

/**
 * Fetch account information for an active account.
 *
 * @param  {string}   accountGUID     Selected account guid.
 */
export const fetchAccount = (accountGUID) => {
    const url = `accounts/${accountGUID}/`;

    return baseAPI.get(url);
};

/**
 * Fetch purchased video downlaod products for the active account.
 *
 * @param  {String} accountGUID  Selected account guid.
 */
export const fetchPurchasedVideoDownloadProducts = (accountGUID) => {
    const url = `accounts/${accountGUID}/video-download-products/`;

    return baseAPI.get(url);
};

/**
 * Fetch active subscriptions for an account.
 *
 * @param  {string}   accountGUID     Selected account guid.
 */
export const fetchSubscriptionsForAccount = (accountGuid) => {
    const url = `accounts/${accountGuid}/subscriptions/`;

    return baseAPI.get(url);
};

/**
 * Cancel subscription for account.
 * @param  {string} accountGUID      Account making the request.
 * @param  {string} subscriptionGUID Subscription to be canceled.
 * @param  {string} reason           Cancelation reason.
 */
export const cancelSubscription = (accountGUID, subscriptionGUID, reason) => {
    const url = `accounts/${accountGUID}/cancel-subscription/`;

    return baseAPI.post(url, {
        reason,
        subscription_guid: subscriptionGUID,
    });
};

/**
 * Attempt a purchase!
 * @param  {object} purchasePayload
 */
export const purchase = (purchasePayload) => {
    const purchaseURL = 'accounts/purchase/';

    return baseAPI.post(purchaseURL, purchasePayload);
};

/**
 * Update payment info.
 * @param  {object} paymentInfoPayload
 */
export const updatePaymentInfo = (accountGUID, paymentInfoPayload) => {
    const updatePaymentInfoURL = `accounts/${accountGUID}/update-payment/`;

    return baseAPI.post(updatePaymentInfoURL, paymentInfoPayload);
};

/**
 * Fetch information for multiple accounts.
 *
 * @param  {object}  accountInfoPayload
 */
export const fetchAccountListInfo = (accountInfoPayload) => {
    const url = `accounts/`;

    return baseAPI.get(url, accountInfoPayload);
};

/**
 * Update an account's submitted promoter score
 * @param {string}   accountGUID     GUID of account holder submitting the score.
 * @param {integer}  promoterScore   Number between 0-10 that user selected on promoter score feedback form.
 * @param {string}   feedback        Optional feedback for low scores.
 */
export const submitPromoterScore = (accountGUID, promoterScore, feedback) => {
    const submitPromoterScoreURL = `accounts/${accountGUID}/promoter-score/`;

    return baseAPI.post(submitPromoterScoreURL, {
        feedback,
        promoter_score: promoterScore,
    });
};

/**
 * Fetch managed accounts data for a given account.
 *
 * @param {string}  accountGUID     GUID of managing account.
 * @param {object}  requestData     Search string, accounts per page, page number, sort value.
 */
export const fetchManagedAccounts = (accountGUID, requestData) => {
    const url = addQueryParametersToURL(`accounts/${accountGUID}/managed-accounts/`, {
        ordering: requestData.sortValue,
        page: requestData.page,
        per_page: requestData.rowsPerPage,
        search: requestData.filterValue,
    });

    return baseAPI.get(url, null, true);
};