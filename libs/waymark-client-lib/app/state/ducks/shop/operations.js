// Local
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService.js';
import * as loginActionNames from 'app/constants/LoginActionNames.js';
import * as selectors from 'app/state/selectors/index.js';
import {
    appURLs,
    queryParams
} from 'app/constants/urls.js';
import {
    goToInternalURL
} from 'app/utils/urls.js';
import {
    createAnonymousUserInformation,
    createSavedDraft,
    fetchCoupon,
    validateCouponForPurchase,
    fetchShopState,
} from 'shared/api/index.js';
import {
    goToExternalURL,
    parseQueryParams
} from 'shared/utils/urls.js';
import {
    UnformattedUserVideoWithVideoDescriptor
} from 'shared/api/types';
import {
    VideoDescriptor
} from '@libs/shared-types';
import loginActionActions from '../loginActions/actions.js';
import offersOperations from '../offers/operations.js';
import savedDraftsActions from '../savedDrafts/actions.js';
import userVideoActions from '../userVideos/actions.js';
import accountOperations from '../accounts/operations.js';
import shopActions from './actions.js';

/**
 * A function that fetches information for a single shopState.
 * @param  {string}   shopStateGUID   guid for that shopState that should be fetched.
 */
const loadShopState = (shopStateGUID) => async (dispatch) => {
    dispatch(shopActions.fetchingShopState());
    try {
        const shopState = await fetchShopState(shopStateGUID);
        dispatch(shopActions.receivedShopState(shopState));
        return shopState;
    } catch (error) {
        dispatch(shopActions.failedShopStateFetch(error));
        throw error;
    }
};

/**
 * Simple operation for clearing out the coupon from both the current url
 * and the store state after a successful purchase.
 */
const clearCoupon = () => (dispatch) => {
    dispatch(shopActions.clearCoupon());

    // Clear coupon query param from url
    const queryParamsWithoutCoupon = parseQueryParams();
    delete queryParamsWithoutCoupon[queryParams.coupon];

    goToInternalURL(window.location.pathname, true, queryParamsWithoutCoupon);
};

/**
 * Fetch a coupon from the server based on the provided couponCode.
 * @param  {string} couponCode
 * @param  {Object} options
 * @param  {boolean} options.shouldValidateWithAccount
 *        Whether to valdate the coupon based on the active account.
 * @param  {boolean} options.shouldStoreValidationError
 *        Whether to store a validation error in the app state, should there be one.
 * @return Serialized coupon object or error
 */
const loadCoupon =
    (couponCode, options = {
        shouldValidateWithAccount: false,
        shouldStoreValidationError: false
    }) =>
    async (dispatch, getState) => {
        dispatch(shopActions.fetchingCoupon());
        let coupon;

        try {
            if (options.shouldValidateWithAccount) {
                const accountGUID = selectors.getAccountGUID(getState());
                coupon = await validateCouponForPurchase(couponCode, accountGUID);
            } else {
                coupon = await fetchCoupon(couponCode);
            }

            if (!coupon.is_valid) {
                /* Only register an invalid coupon error in the store state if
      `shouldStoreValidationError` option is true. */
                const error = options.shouldStoreValidationError ?
                    {
                        errorMessage: 'Coupon code is invalid.'
                    } :
                    null;

                dispatch(shopActions.fetchCouponFailure(error));
                dispatch(clearCoupon());
                return error;
            }
            dispatch(shopActions.fetchCouponSuccess(coupon));
            return coupon;
        } catch (error) {
            const requestError = options.shouldStoreValidationError ?
                {
                    errorMessage: 'Coupon code is invalid.'
                } :
                null;
            dispatch(shopActions.fetchCouponFailure(requestError));
            return requestError;
        }
    };

/**
 * Subtly different than both `loadCoupon` and `validateAndLoadCoupon` operations. When
 * a coupon code is included via a url query parameter, we want to apply that coupon code
 * only if it's valid for the active account. But if it's invalid, we don't want to save that
 * as a `failed` validation state, we simply don't want the coupon to be applied in the store.
 * @param  {string} couponCode
 */
const loadCouponIfValid = (couponCode) => async (dispatch) => {
    dispatch(
        loadCoupon(couponCode, {
            shouldValidateWithAccount: true,
            shouldStoreValidationError: false,
        }),
    );
};

/**
 * Fetch a coupon from the server and validate against based on the provided
 * the current account.
 * @param  {string} couponCode
 * @return Serialized coupon object or error
 */
const validateAndLoadCoupon = (couponCode) => async (dispatch) => {
    dispatch(
        loadCoupon(couponCode, {
            shouldValidateWithAccount: true,
            shouldStoreValidationError: true,
        }),
    );
};

/**
 * Operation for loading the application state for the provided shopStateGUID,
 * accountGUID, and selectedBusinessGUID.
 * @param  {Object} appIdentifiers
 * @param  {string} appIdentifiers.shopStateGUID
 * @param  {string} appIdentifiers.accountGUID
 * @param  {Object} appIdentifiers.brandingProfile
 * @param  {string} appIdentifiers.selectedBusinessGUID
 * @return {Promise}
 */
const loadAppState =
    ({
        shopStateGUID,
        accountGUID,
        brandingProfile,
        coupon,
        thirdPartyConfig
    }) =>
    async (dispatch) => {
        dispatch(shopActions.updateShopState(shopStateGUID));
        dispatch(shopActions.updateThirdPartyConfig(thirdPartyConfig));

        const setupOperations = [
            dispatch(loadShopState(shopStateGUID)),
            /* The only thing we *really* need at start-up is the offers context (to make
    sure we know how many credits the account has). Right now, that's packaged
    along with the offers, so we'll fetch offers here. */
            dispatch(offersOperations.loadOffers(accountGUID)),
        ];

        if (accountGUID) {
            setupOperations.push(dispatch(accountOperations.loadAccount(accountGUID)));
            setupOperations.push(dispatch(accountOperations.loadAccountSubscriptions(accountGUID)));
        }

        if (brandingProfile) {
            setupOperations.push(dispatch(shopActions.receivedBrandingProfile(brandingProfile)));
        }

        await Promise.all(setupOperations);

        // If we have a bootstrapped coupon that's valid for the active account, let's load it.
        if (coupon) {
            dispatch(loadCouponIfValid(coupon.coupon_code));
        }
    };

/**
 * The top-level operation to be run when the app is first loaded, which handles
 * setting initial key state values and kicking off the async loading of the app state.
 * @param  {Object} appConfig  Bootstrapped configuration from the server.
 * @param  {string} appConfig.shopStateGUID
 * @param  {string} appConfig.accountGUID
 * @param  {string} appConfig.selectedBusinessGUID
 * @param  {Object} appConfig.coupon  Active coupon being applied to the store.
 * @param  {Object} appConfig.anonymousUserInformation
 * @return {Promise}
 */
const initializeApp = (appConfig) => async (dispatch) => {
    dispatch(shopActions.settingUpShop(appConfig));

    GoogleAnalyticsService.setUser(appConfig);

    try {
        // Wait for all of the setup operations to run in parallel.
        await dispatch(loadAppState(appConfig));
    } catch (error) {
        console.error('Setup error', error);
        dispatch(shopActions.failedShopSetup(error));
        return;
    }

    dispatch(shopActions.completedShopSetup());
};

/**
 * Thunk for handling the async interactions that take a vidoeSpec
 * and create a UserVideo and SavedDraft record.
 *
 * @param {Object} config
 * @param {VideoDescriptor} config.videoDescriptor   The video descriptor describing the variant and configuration of the video
 * @param {string} config.variantSlug    The slug of the variant for the video
 * @param {string|null} config.businessGUID   The GUID of the business being applied to the video for personalization (null if not applicable)
 * @param {string} config.videoTitle     The video's title
 * @param {Object} config.automatedVoiceOverConfig
 * @param {string|null} config.automatedVoiceOverConfig.speakerGUID The GUID of the automated VO speaker applied to the video
 * @param {string|null} config.automatedVoiceOverConfig.text The text of the automated VO applied to the video
   @param {string|null} config.variantGroupSlug The slug of the variant group which the user picked the video from
 * @param {string[]} config.stockVideoAssetKeys  List of VPS keys for all stock video assets in the video's configuration so we can license them
 *
 * @return {Promise<{
 *   userVideo: UnformattedUserVideoWithVideoDescriptor;
 *   savedDraft: Object;
 * >}
 */
const addVideoSpecToSavedDrafts =
    ({
        videoDescriptor,
        variantSlug,
        businessGUID,
        videoTitle,
        automatedVoiceOverConfig = null,
        variantGroupSlug = null,
        stockVideoAssetKeys = null,
    }) =>
    async (dispatch, getState) => {
        const storeState = getState();

        const accountGUID = selectors.getAccountGUID(storeState);

        const response = await createSavedDraft({
            account_guid: accountGUID,
            video_spec: {
                variant_slug: variantSlug,
                configuration: videoDescriptor,
            },
            business_guid: businessGUID,
            title: videoTitle,
            variant_group_slug: variantGroupSlug,
            stock_video_assets: stockVideoAssetKeys,
            voice_over_text: automatedVoiceOverConfig ? .text || '',
            voice_over_speaker_guid: automatedVoiceOverConfig ? .speakerGUID || null,
        });
        const {
            saved_draft: savedDraft
        } = response;

        /** @type {UnformattedUserVideoWithVideoDescriptor} */
        const userVideo = {
            ...response.user_video,
            videoDescriptor,
        };

        await dispatch(userVideoActions.addUserVideo(userVideo));
        await dispatch(savedDraftsActions.addToSavedDrafts(savedDraft));

        return {
            savedDraft,
            userVideo,
        };
    };

/**
 * Create a copy of a userVideo and add it to drafts.
 *
 * @param {String} userVideoGUID
 * @param {String} newTitle
 */
const copyUserVideo =
    (userVideoGUID, newTitle = '') =>
    async (dispatch, getState) => {
        const storeState = getState();

        const loggedInAccountGUID = selectors.getAccountGUID(storeState);

        /** @type {UnformattedUserVideoWithVideoDescriptor} */
        const userVideo = selectors.getUserVideoByGUID(storeState, userVideoGUID);

        const doesLoggedInUserOwnVideo = userVideo.account === loggedInAccountGUID;
        const userVideoCopy = await dispatch(
            addVideoSpecToSavedDrafts({
                videoDescriptor: userVideo.videoDescriptor,
                variantSlug: userVideo.video_spec.variant_slug,
                // Only transfer the original video's business GUID if the user owns the original video to
                // avoid permissions issues.
                businessGUID: doesLoggedInUserOwnVideo ? userVideo.business : null,
                videoTitle: newTitle || `${userVideo.title} (copy)`,
                // Pass along any existing automated VO config to the new copy
                automatedVoiceOverConfig: {
                    text: userVideo.voice_over_text || '',
                    speakerGUID: userVideo.voice_over_speaker_guid || null,
                },
            }),
        );

        return userVideoCopy;
    };

/**
 * Create an anonymous user for the current shop state.
 * @param  {string} email     Email address
 * @param  {string} firstName First name
 * @param  {string} lastName  Last name
 * @return {object}           Anonymous user information
 */
const createAnonymousUserInformationWithCurrentShopState =
    (email, firstName, lastName) => async (dispatch, getState) => {
        const storeState = getState();
        const shopStateGUID = selectors.getShopStateGUID(storeState);

        const payload = {
            shop_state_guid: shopStateGUID,
            email,
            first_name: firstName,
            last_name: lastName,
        };

        try {
            const anonymousUserInformation = await createAnonymousUserInformation(payload);
            dispatch(shopActions.receivedAnonymousUserInfo(anonymousUserInformation));
            return anonymousUserInformation;
        } catch (error) {
            console.warn('Unable to create anonymous user information record');
            return null;
        }
    };

/**
 * Takes the user to the login page and then returns them to whatever
 * the previous page was on success
 */
const goToLoginPage =
    ({
        pathname: nextPathname,
        search: nextSearch
    } = window.location) =>
    async (dispatch) => {
        // Don't do anything if we're already on the login page
        // Using startsWith so we'll match both "/login" and "/login/"
        if (nextPathname.startsWith(appURLs.login)) {
            return;
        }

        dispatch(
            loginActionActions.addLoginAction({
                name: loginActionNames.navigateToPage,
                args: [],
                nextURL: nextPathname,
                nextSearch,
            }),
        );

        goToInternalURL(appURLs.login);
    };

/**
 * Adds a user-requested image library slug to force it being fetched.
 * This utility is used for instances of our Editor where image libraries are not automatically
 * fetched, like the Studio preview.
 */
const addUserRequestedImageLibrarySlug = (slug) => async (dispatch) => {
    dispatch(shopActions.addUserRequestedImageLibrarySlug(slug));
};

/**
 * Adds a user-requested video asset library slug to force it being fetched.
 */
const addUserRequestedVideoAssetLibrarySlug = (slug) => async (dispatch) => {
    dispatch(shopActions.addUserRequestedVideoAssetLibrarySlug(slug));
};

/**
 * Takes a url for a CMS page, formats it to be branded if the user has a partner with branded CMS, and navigates there
 *
 * @param {string} cmsURL
 */
const goToCmsURL = (cmsURL) => (dispatch, getState) => {
    const brandedCmsURL = selectors.getBrandedCmsURL(getState(), cmsURL);

    goToExternalURL(brandedCmsURL);
};

export default {
    clearCoupon,
    addVideoSpecToSavedDrafts,
    copyUserVideo,
    createAnonymousUserInformationWithCurrentShopState,
    goToCmsURL,
    initializeApp,
    loadAppState,
    loadCoupon,
    loadShopState,
    addUserRequestedImageLibrarySlug,
    addUserRequestedVideoAssetLibrarySlug,
    goToLoginPage,
    validateAndLoadCoupon,
};