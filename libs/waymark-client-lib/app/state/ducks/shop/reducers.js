import {
    uuid
} from 'shared/utils/uuid.js';
import {
    SHOP_CLEAR_COUPON,
    SHOP_CLOSE_COUPON_ALERT,
    SHOP_FETCH_COUPON_FAILURE,
    SHOP_FETCH_COUPON_PENDING,
    SHOP_FETCH_COUPON_SUCCESS,
    SHOP_USER_IMAGE_LIBRARY_SLUG_REQUESTED,
    SHOP_USER_VIDEO_ASSET_LIBRARY_SLUG_REQUESTED,
    SHOP_FETCH_GLOBAL_AUDIO_LIBRARIES_SUCCESS,
    SHOP_INITIALIZE_COMPLETE,
    SHOP_INITIALIZE_ERROR,
    SHOP_INITIALIZE_PENDING,
    SHOP_RECEIVED_ANONYMOUS_USER_INFO,
    SHOP_RECEIVED_BRANDING_PROFILE,
    SHOP_SET_IS_ADMIN_PORTAL,
    SHOP_STATE_FETCH_COMPLETE,
    SHOP_STATE_FETCH_ERROR,
    SHOP_STATE_FETCH_PENDING,
    SHOP_STATE_UPDATED,
    SHOP_THIRD_PARTY_CONFIG_UPDATED,
} from 'app/state/actionTypes.js';

// Reducer
export const DEFAULT_STATE = {
    anonymousUserInformation: null,
    brandingProfile: null,
    coupon: null,
    couponFetchError: null,
    error: '',
    guid: null,
    globalAudioLibraries: [],
    hasDismissedCouponAlert: false,
    hasSetUp: false,
    headerCollections: [],
    homepageFeaturedBannerContent: {},
    homepageHeroContent: {},
    homepagePosterGroups: [],
    homepageSpotlights: {},
    imageLibraries: [],
    isAdminPortal: false,
    isFetchingCoupon: false,
    editorImageLibrarySlugs: [],
    editorVideoAssetLibrarySlugs: [],
    fetchingImageLibrarySlugs: [],
    isFetchingShopState: false,
    isSettingUp: false,
    referralCouponCode: null,
    referralCouponGUID: null,
    thirdPartyConfig: {},
    // Unique ID for this client session - helpful for things like distinguishing between
    // multiple sessions for the same account so we can keep them in sync after a purchase
    clientSessionGUID: uuid(),
};

/**
 * The reducer of shop. Will return the default state for any action.
 *
 * @name reducer
 * @param {Object} state The app state
 * @param {string} action The action being processed
 * @memberOf app.shop.reducers
 */
export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case SHOP_INITIALIZE_PENDING:
            return {
                ...state,
                anonymousUserInformation: action.payload.anonymousUserInformation,
                brandingProfile: action.payload.brandingProfile,
                guid: action.payload.shopStateGUID,
                hasSetUp: false,
                headerCollections: action.payload.homepageConfiguration ? .waymark_header_collections,
                homepageFeaturedBannerContent: action.payload.homepageConfiguration ? .featured_banner_content,
                homepageHeroContent: action.payload.homepageConfiguration ? .hero_content,
                homepagePosterGroups: action.payload.homepageConfiguration ? .poster_groups,
                homepageSpotlights: action.payload.homepageConfiguration ? .spotlights,
                isSettingUp: true,
                referralCouponCode: action.payload.referralCouponCode,
                referralCouponGUID: action.payload.referralCouponGUID,
            };

        case SHOP_INITIALIZE_COMPLETE:
            return { ...state,
                isSettingUp: false,
                hasSetUp: true
            };

        case SHOP_INITIALIZE_ERROR:
            return {
                ...state,
                isSettingUp: false,
                hasSetUp: false,
                error: action.payload,
            };

        case SHOP_STATE_FETCH_PENDING:
            return {
                ...state,
                isFetchingShopState: true,
            };

        case SHOP_STATE_FETCH_COMPLETE:
            return {
                ...state,
                isFetchingShopState: false,
            };

        case SHOP_STATE_FETCH_ERROR:
            return {
                ...state,
                isFetchingShopState: false,
                error: action.payload,
            };

        case SHOP_STATE_UPDATED:
            return {
                ...state,
                guid: action.payload,
            };

        case SHOP_CLOSE_COUPON_ALERT:
            return {
                ...state,
                hasDismissedCouponAlert: true,
            };

        case SHOP_CLEAR_COUPON:
            return {
                ...state,
                coupon: null,
            };

        case SHOP_RECEIVED_ANONYMOUS_USER_INFO:
            return {
                ...state,
                anonymousUserInformation: action.payload,
            };

        case SHOP_FETCH_COUPON_FAILURE:
            return {
                ...state,
                couponFetchError: action.payload,
                isFetchingCoupon: false,
            };

        case SHOP_FETCH_COUPON_PENDING:
            return {
                ...state,
                isFetchingCoupon: true,
                couponFetchError: null,
            };

        case SHOP_FETCH_COUPON_SUCCESS:
            return {
                ...state,
                isFetchingCoupon: false,
                coupon: action.payload,
                hasDismissedCouponAlert: false,
            };

        case SHOP_THIRD_PARTY_CONFIG_UPDATED:
            return {
                ...state,
                thirdPartyConfig: action.payload,
            };

        case SHOP_RECEIVED_BRANDING_PROFILE:
            return {
                ...state,
                brandingProfile: action.payload,
            };

        case SHOP_USER_IMAGE_LIBRARY_SLUG_REQUESTED:
            return {
                ...state,
                editorImageLibrarySlugs: [...state.editorImageLibrarySlugs, action.payload],
            };

        case SHOP_USER_VIDEO_ASSET_LIBRARY_SLUG_REQUESTED:
            return {
                ...state,
                editorVideoAssetLibrarySlugs: [...state.editorVideoAssetLibrarySlugs, action.payload],
            };

        case SHOP_FETCH_GLOBAL_AUDIO_LIBRARIES_SUCCESS:
            return {
                ...state,
                globalAudioLibraries: action.payload,
            };

        case SHOP_SET_IS_ADMIN_PORTAL:
            return {
                ...state,
                isAdminPortal: action.payload,
            };

        default:
            return state;
    }
};