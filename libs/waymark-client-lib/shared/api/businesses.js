// Local
import baseAPI from 'shared/api/core/base.js';
import {
    addQueryParametersToURL
} from '../utils/urls.js';

const BUSINESSES_URI = 'businesses/';

/**
 * Fetch the businesses for the store. Accepts query parameters of 'account_guid'
 * and/or 'shop_state_guid' that should contain the GUIDs of an account or a ShopState.
 *
 * @param  {String} accountGUID Selected account guid.
 * @param  {String} shopStateGUID Selected ShopState guid.
 * @return {Object} Businesses found for the Account or ShopState.
 */
export const fetchBusinesses = ({
    accountGUID,
    shopStateGUID
}) => {
    if (!(accountGUID || shopStateGUID)) {
        console.warn('No accountGUID or shopStateGUID were passed to fetchBusinesses.');
    }

    let url = BUSINESSES_URI;

    if (accountGUID) {
        url = addQueryParametersToURL(url, {
            account_guid: accountGUID,
        });
    }

    if (shopStateGUID) {
        url = addQueryParametersToURL(url, {
            shop_state_guid: shopStateGUID,
        });
    }

    return baseAPI.get(url);
};

/**
 * Fetch a business. Accepts a query parameter of 'business_guid'.
 *
 * @param  {String} businessGUID Business GUID to fetch.
 * @return {Object} Business found for the GUID.
 */
export const fetchBusiness = (businessGUID) => {
    if (!businessGUID) {
        console.warn('No businessGUID was passed to fetchBusiness.');
    }

    return baseAPI.get(`${BUSINESSES_URI}${businessGUID}/`);
};

/**
 * Create a business from a payload. The payload is serialized and then saved
 * to the database, and the newly created business is returned.
 *
 * @param  {String}  payload                        Serializable business payload with business guid
 * @param  {Object}  payload.account                (Optional) Serializable account
 * @param  {String}  payload.business_name          (Optional) Business name
 * @param  {String}  payload.city                   (Optional) City
 * @param  {String}  payload.country_code           (Optional) Country code
 * @param  {String}  payload.industry               (Optional) Serializable industry
 * @param  {String}  payload.industry_name          (Optional) Industry name
 * @param  {String}  payload.postal_code            (Optional) Postal code
 * @param  {Object}  payload.search_result_group    (Optional) Serializable search result group
 * @param  {String}  payload.street_address_1       (Optional) Street address line 1
 * @param  {String}  payload.street_address_2       (Optional) Street address line 2
 * @param  {String}  payload.street_address_3       (Optional) Street address line 3
 * @param  {String}  payload.state                  (Optional) State
 * @param  {String}  payload.contact_email_address  (Optional) Contact email address
 * @param  {String}  payload.contact_phone          (Optional) Contact phone number
 * @param  {String}  payload.website_url            (Optional) Website URL
 * @return {Object}                                 Created business
 */
export const createBusiness = (payload) => baseAPI.post(BUSINESSES_URI, payload);