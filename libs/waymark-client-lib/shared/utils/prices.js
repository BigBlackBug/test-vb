// Vendor
import _ from 'lodash';

/**
 * Calculate an amount with a coupon.
 *
 * @param  {Number}  amount  A non-discounted amount
 * @param  {Object}  coupon  A coupon object
 * @return {Number}          A discounted amount
 */
export function calculateAmountWithCoupon(amount, coupon) {
    if (coupon && coupon.percent_off) {
        return amount - amount * (coupon.percent_off / 100);
    }

    if (coupon && coupon.amount_off) {
        // No negative prices!!
        return Math.max(amount - coupon.amount_off, 0);
    }

    return amount;
}

/**
 * Calculate the total off of an amount with a coupon.
 *
 * @param  {Number}  amount  A non-discounted amount
 * @param  {Object}  coupon  A coupon object
 * @return {Number}          A total value off of an amount
 */
export function calculateValueOffWithCoupon(amount, coupon) {
    if (coupon && coupon.percent_off) {
        return amount * (coupon.percent_off / 100);
    }

    if (coupon && coupon.amount_off) {
        // Return the amount off
        return coupon.amount_off;
    }

    return 0;
}

/**
 * Returns a total value for an array of purchasable items.
 * @param  {[purchasableItems]}  items  Purchasable item objects
 * @return {number}                     Total value of purchasable items
 */
export const getTotalFromItems = (items) => _.sumBy(items, 'total') || 0;