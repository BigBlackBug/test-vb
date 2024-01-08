// Local
import baseAPI from 'shared/api/core/base.js';
import {
    addQueryParametersToURL
} from '../utils/urls.js';

/**
 * Fetches the valid offers for a given account. If no accountGUID, is provided
 * it will fetch all valid offers for a user who doesn't yet have an account.
 *
 * @param  {String} [accountGUID] Selected account guid.
 * Two options control this retry behavior:
 * @return {Object} Offer `offer` and `context` keys -- see `api/offers/views.py`
 *
 */
/* eslint-disable-next-line import/prefer-default-export */
export const fetchOffers = async (accountGUID) => {
    // Prepare the URL based on whether or not an
    // accountGUID is present
    let accountOffersURL = 'offers/';
    if (accountGUID) {
        accountOffersURL = addQueryParametersToURL(accountOffersURL, {
            account_guid: accountGUID
        });
    }

    return baseAPI.get(accountOffersURL);
};