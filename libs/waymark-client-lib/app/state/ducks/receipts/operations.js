// Local
import * as selectors from 'app/state/selectors/index.js';
import {
    fetchReceipt
} from 'shared/api/index.js';
import actions from './actions.js';

// Operations

/**
 * Load the receipt for the provided guid from the server.
 *
 * @param {String} receiptGUID - The GUID of the receipt to load.
 */
const loadReceipt = (receiptGUID) => async (dispatch, getState) => {
    const storeState = getState();
    if (!selectors.shouldFetchReceipt(storeState, receiptGUID)) {
        return;
    }

    dispatch(actions.fetchingReceipt(receiptGUID));
    try {
        const receipt = await fetchReceipt(receiptGUID);
        dispatch(actions.receivedReceipt(receiptGUID, receipt));
    } catch (error) {
        console.error('Receipt fetch error', error);
        dispatch(actions.failedReceiptFetch(receiptGUID, error));

        // Rethrowing the error here allows it to be trapped by withAPIObjectExists(),
        // so that the OfferCheckoutSuccessPage can display a `Page not found` page for
        // incorrect receipt GUIDs.
        throw error;
    }
};

export default {
    loadReceipt
};