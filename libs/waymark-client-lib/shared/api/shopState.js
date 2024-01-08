// Local
import baseAPI from 'shared/api/core/base.js';

/**
 * GET `/shop/{shopStateGUID}/cart-items`
 *
 * Fetch all current cartItems for the store.
 */
export const fetchCartItems = (shopStateGUID) => baseAPI.get(`shops/${shopStateGUID}/cart-items/`);

/**
 * GET  `/shop/{GUID}`
 * Retrieve the shop state data.
 * @param  {String} [shopStateGUID] - Shop state's guid.
 * @return {object} Serialized shop state.
 */
export const fetchShopState = (shopStateGUID) => {
    const url = `shops/${shopStateGUID}/`;
    return baseAPI.get(url);
};

/**
 * POST `/anonymous-user-information/`
 *
 * Create AnonymousUserInformation for a ShopState from a payload
 * containing a shop state guid and user information.
 *
 * @param  {object}  payload
 * @param  {string}  payload.shop_state_guid  ShopState GUID
 * @param  {string}  payload.email            (Optional) Email
 * @param  {string}  payload.first_name       (Optional) First name
 * @param  {string}  payload.last_name        (Optional) Last name
 */
export const createAnonymousUserInformation = (payload) => {
    const url = 'anonymous-user-information/';
    return baseAPI.post(url, payload);
};