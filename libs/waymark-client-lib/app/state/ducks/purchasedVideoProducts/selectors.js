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
 * Get all PurchasedVideo objects loaded into the state.
 * @param  {Object} state
 */
localSelectors.getPurchasedVideoProducts = (state) => state.items;

/**
 * Get an array of user video guids for all purchased videos
 */
localSelectors.getPurchasedUserVideoGUIDs = (state) =>
    state.items.map((purchasedVideo) => purchasedVideo.user_video);

/**
 * Get a purchased video for a given user video
 * @param   {Object} state
 * @param   {String} userVideoGUID
 */
localSelectors.getPurchasedVideoProductByUserVideoGUID = (state, userVideoGUID) =>
    _.find(state.items, {
        user_video: userVideoGUID
    });

/**
 * Get the coupon code used to buy a given user video, if applicable
 *
 * @param {object}  state
 * @param {string}  userVideoGUID
 *
 * @returns The coupon code used to purchase the given user video, or null if the video is unpurchased or wasn't
 *          purchased with a coupon
 */
localSelectors.getPurchasedVideoCouponCodeByUserVideoGUID = (state, userVideoGUID) => {
    const purchasedVideo = localSelectors.getPurchasedVideoProductByUserVideoGUID(
        state,
        userVideoGUID,
    );

    return purchasedVideo ? purchasedVideo.purchased_with_coupon_code : null;
};

/**
 * Returns whether the purchased VideoDownloadProducts for the current Account are currently
 * being fetched from the server.
 * @param  {Object} state
 */
localSelectors.isFetchingAllPurchasedVideoProducts = (state) => state.isFetchingAll;

/**
 * Returns whether the purchased VideoDownloadProducts for the current Account have been
 * fetched from the server.
 * @param  {Object} state
 */
localSelectors.hasFetchedAllPurchasedVideoProducts = (state) => state.hasFetchedAll;

/**
 * Based on outstanding or already-completed requests, returns whether to fetch
 * the VideoDownloadProducts from the server.
 * @param  {Object} state
 */
localSelectors.shouldFetchAllPurchasedVideoProducts = (state) =>
    !(
        localSelectors.isFetchingAllPurchasedVideoProducts(state) ||
        localSelectors.hasFetchedAllPurchasedVideoProducts(state)
    );

export default localSelectors;

// Export global selectors.
const moduleName = 'purchasedVideoProducts';
const localPath = stateKeys[moduleName];

export const getPurchasedVideoProducts = globalizeSelector(
    localSelectors.getPurchasedVideoProducts,
    localPath,
);
export const getPurchasedUserVideoGUIDs = globalizeSelector(
    localSelectors.getPurchasedUserVideoGUIDs,
    localPath,
);
export const getPurchasedVideoProductByUserVideoGUID = globalizeSelector(
    localSelectors.getPurchasedVideoByUserVideoGUID,
    localPath,
);
export const getPurchasedVideoCouponCodeByUserVideoGUID = globalizeSelector(
    localSelectors.getPurchasedVideoCouponCodeByUserVideoGUID,
    localPath,
);
export const hasFetchedAllPurchasedVideoProducts = globalizeSelector(
    localSelectors.hasFetchedAllPurchasedVideoProducts,
    localPath,
);
export const isFetchingAllPurchasedVideoProducts = globalizeSelector(
    localSelectors.isFetchingAllPurchasedVideoProducts,
    localPath,
);
export const shouldFetchAllPurchasedVideoProducts = globalizeSelector(
    localSelectors.shouldFetchAllPurchasedVideoProducts,
    localPath,
);