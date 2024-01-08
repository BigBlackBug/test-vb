import {
    PromiseCache
} from 'app/objects.js';
import * as selectors from 'app/state/selectors/index.js';
import {
    fetchPurchasedVideoDownloadProducts,
    fetchVideoDownloadProductForUserVideo,
} from 'shared/api/index.js';
import actions from './actions.js';

// We cache the promises returned by the `fetchPurchasedVideoDownloadProducts` API call here, which
// we'll use to ensure that any call to the `loadPurchasedVideoProducts` operation that occurs
// while a request is already outstanding can be returned the appropriate promise.
const loadingPurchasedVideoProducts = new PromiseCache();

/**
 * Load the VideoDownloadProduct records into the store. NOTE: Does not include loading of any
 * underlying or related resources (UserVideos, ConfiguredVideos).
 * @param  {string} accountGUID
 * @param  {boolean} [shouldForceFetch]
 *        `true` if we should fetch from the server regardless of what we have in state.
 */
const loadPurchasedVideoProducts = (accountGUID, shouldForceFetch = false) => async (
    dispatch,
    getState,
) => {
    const storeState = getState();
    const shouldfetchPurchasedVideoDownloadProducts = selectors.shouldFetchAllPurchasedVideoProducts(
        storeState,
    );

    // If we've already fetched and we already have purchased videos in our state, let's return them.
    if (!shouldfetchPurchasedVideoDownloadProducts && !shouldForceFetch) {
        // Checking if we're waiting for this to complete.
        if (loadingPurchasedVideoProducts.get(accountGUID)) {
            return loadingPurchasedVideoProducts.get(accountGUID);
        }

        // Otherwise, we'll return whatever we've got loaded.
        return selectors.getPurchasedVideoProducts(storeState);
    }

    // If we need to fetch the purchased videos, let's get to it!
    dispatch(actions.fetchingPurchasedVideoProducts());

    try {
        const fetchingPurchasedVideoProducts = fetchPurchasedVideoDownloadProducts(accountGUID);
        // Store the promise in the cache in case we need it later.
        loadingPurchasedVideoProducts.set(accountGUID, fetchingPurchasedVideoProducts);
        const products = await fetchingPurchasedVideoProducts;

        // The request completed, so let's null out the cache.
        loadingPurchasedVideoProducts.clear(accountGUID);
        dispatch(actions.receivedPurchasedVideoProducts(products));
        return products;
    } catch (error) {
        // The request completed (failed), so let's null out the cache.
        loadingPurchasedVideoProducts.clear(accountGUID);
        dispatch(actions.failedPurchasedVideoProductsFetch(error));
        return error;
    }
};

/**
 * Load a VideoDownloadProduct record for a given user video
 * @param {string} userVideoGUID
 */
const loadPurchasedVideoProductForUserVideo = (userVideoGUID) => async (dispatch) => {
    const purchasedVideo = await fetchVideoDownloadProductForUserVideo(userVideoGUID);
    // Add or update the retrieved purchased video in our list of loaded purchased videos
    dispatch(actions.updatePurchasedVideoProduct(purchasedVideo));
};

export default {
    loadPurchasedVideoProducts,
    loadPurchasedVideoProductForUserVideo,
};