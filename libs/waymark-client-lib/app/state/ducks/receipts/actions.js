import {
    RECEIPT_FETCH_COMPLETE,
    RECEIPT_FETCH_ERROR,
    RECEIPT_FETCH_PENDING,
} from 'app/state/actionTypes.js';

// Action Creations

/**
 * Starting a fetch for Receipt from the server.
 * @param {String} receiptGUID - The GUID of the receipt we're fetching images for.
 */
const fetchingReceipt = (receiptGUID) => ({
    type: RECEIPT_FETCH_PENDING,
    payload: {
        receiptGUID
    },
});

/**
 * Received Receipt from the server.
 * @param {String} receiptGUID - The GUID of the receipt we're fetching images for.
 * @param  {Object} receipt
 */
const receivedReceipt = (receiptGUID, receipt) => ({
    type: RECEIPT_FETCH_COMPLETE,
    payload: {
        receipt,
        receiptGUID,
    },
});

/**
 * Failed Receipt fetching.
 * @param {String} receiptGUID - The GUID of the receipt we're fetching images for.
 * @param  {String} error
 */
const failedReceiptFetch = (receiptGUID, error) => ({
    type: RECEIPT_FETCH_ERROR,
    payload: {
        error,
        receiptGUID,
    },
});

export default {
    failedReceiptFetch,
    fetchingReceipt,
    receivedReceipt,
};