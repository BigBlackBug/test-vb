// Vendor
import _ from 'lodash';

// Local
import {
    globalizeSelector
} from 'app/utils/selectors.js';
import {
    stateKeys
} from 'app/constants/State.js';

const localSelectors = {};

/**
 * Returns the receipt with the provided GUID
 * @param  {Object} state
 * @param  {string} receiptGUID - Receipt to check for.
 */
localSelectors.getReceiptByGUID = (state, receiptGUID) =>
    _.find(state.items, {
        guid: receiptGUID
    });

/**
 * Returns the total purchase amount for the provided receipt.
 * @param  {Object} state
 * @param  {string} receiptGUID - Receipt to check for.
 */
localSelectors.getReceiptTotal = (state, receiptGUID) => {
    const receipt = localSelectors.getReceiptByGUID(state, receiptGUID);
    return receipt ? receipt.amount : null;
};

/**
 * Returns the receipt with the provided GUID
 * @param  {Object} state
 * @param  {string} receiptGUID - Receipt to check for.
 */
localSelectors.getReceiptOffersForReceipt = (state, receiptGUID) => {
    const receipt = localSelectors.getReceiptByGUID(state, receiptGUID);
    return receipt ? receipt.receipt_offers : [];
};

/**
 * Returns whether the Receipts is currently being fetched from the server.
 * @param  {Object} state
 * @param  {string} receiptGUID - Receipt to check for.
 */
localSelectors.isFetchingReceipt = (state, receiptGUID) => state.isFetchingFor[receiptGUID];

/**
 * Returns whether the Receipt has been fetched from the server.
 * @param  {Object} state
 * @param  {string} receiptGUID - Receipt to check for.
 */
localSelectors.hasFetchedReceipt = (state, receiptGUID) => state.hasFetchedFor[receiptGUID];

/**
 * Based on outstanding or already-completed requests, returns whether to fetch
 * the Receipt from the server.
 * @param  {Object} state
 * @param  {string} receiptGUID - Receipt to check for.
 */
localSelectors.shouldFetchReceipt = (state, receiptGUID) =>
    !(
        localSelectors.isFetchingReceipt(state, receiptGUID) ||
        localSelectors.hasFetchedReceipt(state, receiptGUID)
    );

export default localSelectors;

// Export global selectors.
const moduleName = 'receipts';
const localPath = stateKeys[moduleName];

export const getReceiptByGUID = globalizeSelector(localSelectors.getReceiptByGUID, localPath);
export const getReceiptOffersForReceipt = globalizeSelector(
    localSelectors.getReceiptOffersForReceipt,
    localPath,
);
export const getReceiptTotal = globalizeSelector(localSelectors.getReceiptTotal, localPath);
export const hasFetchedReceipt = globalizeSelector(localSelectors.hasFetchedReceipt, localPath);
export const isFetchingReceipt = globalizeSelector(localSelectors.isFetchingReceipt, localPath);
export const shouldFetchReceipt = globalizeSelector(localSelectors.shouldFetchReceipt, localPath);