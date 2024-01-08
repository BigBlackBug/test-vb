// Local
import {
    PURCHASED_VIDEO_PRODUCTS_FETCH_COMPLETE,
    PURCHASED_VIDEO_PRODUCTS_FETCH_ERROR,
    PURCHASED_VIDEO_PRODUCTS_FETCH_PENDING,
    PURCHASED_VIDEO_PRODUCT_UPDATE,
} from '../../actionTypes.js';

/**
 * Fetching the purchased video products for the user (account).
 */
const fetchingPurchasedVideoProducts = () => ({
    type: PURCHASED_VIDEO_PRODUCTS_FETCH_PENDING,
});

/**
 * Recieved purchased video products from the server.
 * @param  {VideoDownloadProduct[]} products
 */
const receivedPurchasedVideoProducts = (products) => ({
    type: PURCHASED_VIDEO_PRODUCTS_FETCH_COMPLETE,
    payload: products,
});

/**
 * Error while fetching purchased video products for the account.
 * @param  {String} error
 */
const failedPurchasedVideoProductsFetch = (error) => ({
    type: PURCHASED_VIDEO_PRODUCTS_FETCH_ERROR,
    payload: error,
});

/**
 * Updates a purchased video with a matching guid in the purchased video list
 * @param {VideoDownloadProduct} product
 */
const updatePurchasedVideoProduct = (product) => ({
    type: PURCHASED_VIDEO_PRODUCT_UPDATE,
    payload: product,
});

export default {
    failedPurchasedVideoProductsFetch,
    fetchingPurchasedVideoProducts,
    receivedPurchasedVideoProducts,
    updatePurchasedVideoProduct,
};