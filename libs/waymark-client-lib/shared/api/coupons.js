// Local
import baseAPI from 'shared/api/core/base.js';

/**
 * Fetch coupon information based on the provided couponCode.
 * @param  {string}   couponCode     Human-readable coupon code.
 */
export const fetchCoupon = (couponCode) => {
    const url = `coupons/${couponCode}/`;

    return baseAPI.get(url);
};

/**
 * Fetch a coupon validated for the current purchasing account.
 * @param  {string} couponCode
 * @param  {string || null} accountGUID
 */
export const validateCouponForPurchase = (couponCode, accountGUID) => {
    const url = `coupons/${couponCode}/validate-for-purchase/`;

    return baseAPI.get(url, {
        account_guid: accountGUID,
    });
};