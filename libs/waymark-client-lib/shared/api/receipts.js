// Local
import baseAPI from 'shared/api/core/base.js';

/**
 * Fetch the receipt for the provided guid.
 * @param  {String} [receiptGUID] Receipt guid to fetch.
 * @return {Object} Serialized receipt.
 */
/* eslint-disable-next-line import/prefer-default-export */
export const fetchReceipt = (receiptGUID) => {
    const url = `receipts/${receiptGUID}/`;
    return baseAPI.get(url);
};