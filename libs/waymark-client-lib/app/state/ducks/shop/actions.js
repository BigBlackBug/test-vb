import {
    SHOP_CLEAR_COUPON,
    SHOP_CLOSE_COUPON_ALERT,
    SHOP_FETCH_COUPON_FAILURE,
    SHOP_FETCH_COUPON_PENDING,
    SHOP_FETCH_COUPON_SUCCESS,
    SHOP_FETCH_GLOBAL_AUDIO_LIBRARIES_SUCCESS,
    SHOP_USER_IMAGE_LIBRARY_SLUG_REQUESTED,
    SHOP_USER_VIDEO_ASSET_LIBRARY_SLUG_REQUESTED,
    SHOP_INITIALIZE_COMPLETE,
    SHOP_INITIALIZE_ERROR,
    SHOP_INITIALIZE_PENDING,
    SHOP_RECEIVED_ANONYMOUS_USER_INFO,
    SHOP_RECEIVED_BRANDING_PROFILE,
    SHOP_SET_SHOULD_REFETCH,
    SHOP_STATE_FETCH_COMPLETE,
    SHOP_SET_IS_ADMIN_PORTAL,
    SHOP_STATE_FETCH_ERROR,
    SHOP_STATE_FETCH_PENDING,
    SHOP_STATE_UPDATED,
    SHOP_THIRD_PARTY_CONFIG_UPDATED,
} from 'app/state/actionTypes.js';

/**
 * Shop setup in progress.
 * @memberOf app.shop.actionCreators
 */
const settingUpShop = (appConfig) => ({
    type: SHOP_INITIALIZE_PENDING,
    payload: appConfig,
});

/**
 * The setup tasks for a shop are complete (app CONFIG populated in the store, etc.)
 * @memberOf app.shop.actionCreators
 */
const completedShopSetup = () => ({
    type: SHOP_INITIALIZE_COMPLETE,
});

/**
 * Experienced a failure during shop setup.
 * @memberOf app.shop.actionCreators
 */
const failedShopSetup = (error) => ({
    type: SHOP_INITIALIZE_ERROR,
    payload: error,
});

/**
 * Starting a fetch for shopState from the server.
 */
const fetchingShopState = () => ({
    type: SHOP_STATE_FETCH_PENDING,
});

/**
 * Received shopState from the server.
 * @param  {Object || Array} shopState
 */
const receivedShopState = (shopState) => ({
    type: SHOP_STATE_FETCH_COMPLETE,
    payload: shopState,
});

/**
 * Failed shopState fetching.
 * @param  {String} error
 */
const failedShopStateFetch = (error) => ({
    type: SHOP_STATE_FETCH_ERROR,
    payload: error,
});

/**
 * Clears the currently active coupon from the store state.
 */
const clearCoupon = () => ({
    type: SHOP_CLEAR_COUPON,
});

/**
 * Closes the coupon alert header in the store state.
 */
const closeCouponAlert = () => ({
    type: SHOP_CLOSE_COUPON_ALERT,
});

/**
 * Started fetching a coupon from the server.
 */
const fetchingCoupon = () => ({
    type: SHOP_FETCH_COUPON_PENDING,
});

/**
 * Successful response from fetching a coupon.
 * @param  {Object} coupon Serialized coupon
 */
const fetchCouponSuccess = (coupon) => ({
    type: SHOP_FETCH_COUPON_SUCCESS,
    payload: coupon,
});

/**
 * Failure response from fetching a coupon.
 * @param  {Object} error Error object
 */
const fetchCouponFailure = (error) => ({
    type: SHOP_FETCH_COUPON_FAILURE,
    payload: error,
});

/**
 * Action for clearing the state of all user-specific data,
 * which we'll want to
 */
const requestDataRefresh = () => ({
    type: SHOP_SET_SHOULD_REFETCH,
});

/**
 * Action to update the shop state.
 */
const updateShopState = (shopStateGUID) => ({
    type: SHOP_STATE_UPDATED,
    payload: shopStateGUID,
});

/**
 * Action to update the configuration of third party libraries and applications.
 */
const updateThirdPartyConfig = (thirdPartyConfig) => ({
    type: SHOP_THIRD_PARTY_CONFIG_UPDATED,
    payload: thirdPartyConfig,
});

/**
 * Action to add a fetched (newly created or updated) AnonymousUserInfo to the shop duck.
 */
const receivedAnonymousUserInfo = (anonymousUserInfo) => ({
    type: SHOP_RECEIVED_ANONYMOUS_USER_INFO,
    payload: anonymousUserInfo,
});

/**
 * Action to add a branding profile to the shop duck.
 */
const receivedBrandingProfile = (brandingProfile) => ({
    type: SHOP_RECEIVED_BRANDING_PROFILE,
    payload: brandingProfile,
});

/**
 * Action to add a user requested image library slug to the overall list of image library slugs
 */
const addUserRequestedImageLibrarySlug = (slug) => ({
    type: SHOP_USER_IMAGE_LIBRARY_SLUG_REQUESTED,
    payload: slug,
});

/**
 * Action to add a user requested video asset library slug to the overall list of video asset library slugs
 */
const addUserRequestedVideoAssetLibrarySlug = (slug) => ({
    type: SHOP_USER_VIDEO_ASSET_LIBRARY_SLUG_REQUESTED,
    payload: slug,
});

/**
 * Action to signal success fetching global audio libraries from the server.
 */
const fetchGlobalAudioLibrariesSuccess = (globalAudioLibraries) => ({
    type: SHOP_FETCH_GLOBAL_AUDIO_LIBRARIES_SUCCESS,
    payload: globalAudioLibraries,
});

/**
 * Action to mark whether or not the current session is in the admin portal.
 */
const setIsAdminPortal = (isAdminPortal) => ({
    type: SHOP_SET_IS_ADMIN_PORTAL,
    payload: isAdminPortal,
});

export default {
    clearCoupon,
    closeCouponAlert,
    completedShopSetup,
    failedShopSetup,
    failedShopStateFetch,
    fetchingCoupon,
    fetchCouponFailure,
    fetchCouponSuccess,
    fetchGlobalAudioLibrariesSuccess,
    addUserRequestedImageLibrarySlug,
    addUserRequestedVideoAssetLibrarySlug,
    fetchingShopState,
    receivedAnonymousUserInfo,
    receivedBrandingProfile,
    receivedShopState,
    requestDataRefresh,
    setIsAdminPortal,
    settingUpShop,
    updateShopState,
    updateThirdPartyConfig,
};