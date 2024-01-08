// Vendor
import _ from 'lodash';

// Local
import {
    parseQueryParams
} from 'shared/utils/urls.js';
import {
    appURLs
} from 'app/constants/urls.js';
import {
    goToInternalURL
} from 'app/utils/urls.js';
import PurchaseHelper from 'app/services/PurchaseHelper.js';
import * as selectors from 'app/state/selectors/index.js';
import GoogleAnalyticsService from 'app/services/GoogleAnalyticsService.js';
import GoogleAdsService from 'app/services/GoogleAdsService.js';
import StripeService from 'app/services/StripeService.js';
import {
    getBasicCreditCardFieldErrors
} from 'app/utils/purchase.js';
import {
    purchase
} from 'shared/api/index.js';
import {
    updatePaymentInfo
} from 'shared/api/accounts.js';
import accountActions from 'app/state/ducks/accounts/actions.js';
import authOperations from 'app/state/ducks/accounts/authOperations.js';
import accountsOperations from 'app/state/ducks/accounts/operations.js';
import offerActions from 'app/state/ducks/offers/actions.js';
import receiptsOperations from 'app/state/ducks/receipts/operations.js';
import shopOperations from 'app/state/ducks/shop/operations.js';
import checkoutOperations from 'app/state/ducks/checkout/operations.js';
import {
    uuid
} from 'shared/utils/uuid.js';
import settings from 'shared/utils/settings.js';
import errorCodes from 'app/constants/StripeErrors.js';
import {
    firstPurchaseEvent,
    premiereSignupEvent,
    purchaseEvent,
} from 'app/constants/ConversionEvents.js';
import {
    trackFacebookPixelEvent
} from 'app/utils/facebookPixel.js';
import {
    apolloClient
} from 'shared/api/graphql';
import {
    accountPageUserVideosQueryName,
    lastEditedUserVideoInfoQueryName,
} from 'app/models/userVideos/queries';
import {
    getStockImagesForImageKeys
} from 'shared/api/graphql/imageLibraries/queries';
import ShutterstockService from 'shared/services/ShutterstockService';
import {
    AssetLicensePurpose
} from '@libs/media-asset-management-ts/src/asset';
import purchaseActions from './actions.js';

/**
 * A shared hook for the beginning of any purchase attempt.
 * @returns Redux store state object -- the "before purchase" state.
 */
const beginPurchaseAttempt = () => (dispatch, getState) => {
    // Start the attempt.
    dispatch(purchaseActions.attemptingPurchase());

    /* Provide the calling purchase operation with the pre-purchase store state
    to facilitate any logic that depends on comparing the pre-purchase and post-purchase
    state of the account. */
    return getState();
};

/**
 * A shared post-purchase hook that completes purchase attempts and handles global
 * post-purchase actions/operations.
 *
 * NOTE: this should only be used to accomplish post-purchase actions that are shared across
 * every type of purchase in our store. Context-specific actions should be handled within
 * the relevant specific purchase operation below.
 * @param  {Object} response  The response of the purchase API request from the server
 * @param  {Object} beforePurchaseState The store state immediately prior to
 */
const completePurchaseAttempt = (response, beforePurchaseState) => (dispatch, getState) => {
    const afterPurchaseState = getState();

    // If the user has no purchased videos, assume this is a first purchase.
    const isFirstPurchase = !selectors.hasMadePurchase(beforePurchaseState);
    const receiptTotal = selectors.getReceiptTotal(afterPurchaseState, response.receipt.guid);

    // Round up receiptTotal and convert it to an int.
    // The receiptTotal is a decimal string, but Google
    // Analytics only supports int `value` inputs.
    const roundedTotal = Number(parseFloat(receiptTotal).toFixed());

    // Track purchase events.
    GoogleAdsService.trackConversion({
        conversionName: purchaseEvent,
        value: roundedTotal,
        transactionID: response.receipt.guid,
    });
    trackFacebookPixelEvent(purchaseEvent, {
        value: roundedTotal
    });

    // Track first purchase events, if relevant.
    if (isFirstPurchase) {
        GoogleAnalyticsService.trackEvent('new_purchaser', {
            eventCategory: 'checkout',
            value: roundedTotal,
        });

        GoogleAdsService.trackConversion({
            conversionName: firstPurchaseEvent,
            value: roundedTotal,
            transactionID: response.receipt.guid,
        });

        trackFacebookPixelEvent(firstPurchaseEvent, {
            value: roundedTotal
        });
    }

    try {
        // If the purchase had a dollar amount, let's track it as a conversion
        if (roundedTotal) {
            (window.referralJS ? ? = {}).conversion = {
                debug: settings.APP_ENVIRONMENT !== 'prod',
                parameters: {
                    email: selectors.getAccountEmail(storeState),
                    fullName: selectors.getAccountName(storeState),
                    externalIdentifier: selectors.getAccountGUID(storeState),
                    amount: roundedTotal,
                    customOption: {
                        firstPurchase: isFirstPurchase,
                    },
                },
            };
        }
    } catch (e) {
        console.error('Something went wrong when attempting to track referral conversion:', e);
    }

    dispatch(purchaseActions.completedPurchaseAttempt(response));
};

/**
 * Handles the validation of provided payment information, both locally
 * and via the Stripe api. Intended to be used during a purchase attempt.
 * @param  {(object|null)}   paymentInfo An object of payment information or null.
 * @return {object}   { isValidationError, paymentToken }
 */
const validatePaymentInfo = (paymentInfo) => async (dispatch) => {
    let paymentToken = null;

    // Only validate if we have card info -- a `null` value here suggests we're using existing
    // credit card information for the account.
    if (paymentInfo) {
        // Validate the fields locally to make sure nothing is missing.
        const fieldErrors = getBasicCreditCardFieldErrors(paymentInfo);
        if (!_.isEmpty(fieldErrors)) {
            dispatch(purchaseActions.failedPurchaseAttempt({
                fieldErrors
            }));
            return {
                paymentToken,
                error: {
                    fieldErrors
                },
                isValidationError: true
            };
        }

        // If we have all the fields, validate on Stripe.
        try {
            paymentToken = await StripeService.validateCardInfo(paymentInfo);
        } catch (error) {
            // Check if we have a mapping of field to stripe error code.
            // If we do use that message instead of Stripe's copy.
            if (errorCodes[error.code]) {
                const {
                    fieldName,
                    message
                } = errorCodes[error.code];

                const formattedError = {
                    fieldErrors: {
                        [fieldName]: message,
                    },
                };

                // Populate both field error and non-field error fields for payment form display.
                dispatch(purchaseActions.failedPurchaseAttempt(formattedError));

                return {
                    paymentToken,
                    error: formattedError,
                    isValidationError: true
                };
            }

            const formattedError = {
                errorMessage: error.message,
            };

            dispatch(purchaseActions.failedPurchaseAttempt(formattedError));

            return {
                paymentToken,
                error: formattedError,
                isValidationError: true
            };
        }
    }

    return {
        paymentToken,
        isValidationError: false
    };
};

/**
 * Handle the retrieval of an existing account -- or the remote creation of a
 * new account -- during a purchase attempt. NOTE: In order to reuse the `signup`
 * endpoint for accout creation, we create a temporary password for the user,
 * which will then be re-set by the user themself on the purchase-success page.
 * @param  {string}   emailAddress    Email address associated with account
 * @param  {string}   companyName     Company name associated with account
 * @param  {boolean}  [accountGroupInviteCode] Unique invite code for AccountGroup that user should be added to
 * @return {object}   { account, isAccountError, isExistingAccount }
 */
const getOrCreateAccount =
    (emailAddress, companyName, accountGroupInviteCode = null) =>
    async (dispatch, getState) => {
        const storeState = getState();
        let account = selectors.getAccount(storeState);

        // If we've already got one, return it!
        if (!_.isEmpty(account)) {
            return {
                account,
                isAccountError: false,
                isExistingAccount: true
            };
        }

        // If we don't have an account, we need to make one before trying to purchase.
        try {
            // Set a temporary password and then ask the user to change it after purchase.
            const temporaryLoginInfo = {
                emailAddress,
                companyName,
                password: uuid(),
                accountGroupInviteCode,
            };
            const shouldNavigate = false;
            account = await dispatch(authOperations.signup(temporaryLoginInfo, shouldNavigate));
            dispatch(accountActions.requestPasswordReset());
            return {
                account,
                isAccountError: false,
                isExistingAccount: false
            };
        } catch (error) {
            dispatch(purchaseActions.failedPurchaseAttempt(error));
            console.error(error);
            return {
                account,
                isAccountError: true,
                isExistingAccount: false
            };
        }
    };

/**
 * Custom purchase exception to be thrown during failed purchase attempts.
 * @param  {string} message Description of the error that occurred.
 */
function PurchaseException(message) {
    this.message = message;
    this.name = 'PurchaseException';
}

PurchaseException.prototype = new Error();

/**
 * After a purchase is complete, make sure we re-fetch the necessary data from
 * the server and update the store state to keep our front-end state up to date
 * with the account's latest purchase activity. Currently this includes:
 *  - Clearing any coupon that was used in the purchase
 *  - Re-fetching account details in case we have new account info from purchase
 *  - Re-fetching account subscription information
 *  - Re-fetching account offers
 *  - Fetch the receipt for the completed purchase
 * @param  {string} accountGUID GUID for the active account
 * @return {Promise}
 */
const refreshStoreAfterPurchase =
    (accountGUID, receiptGUID = null, shouldClearCoupon = true) =>
    (dispatch) => {
        const refreshOperations = [
            dispatch(accountsOperations.loadAccount(accountGUID)),
            dispatch(accountsOperations.loadAccountSubscriptions(accountGUID)),
        ];

        // For upsell purchases, we don't need to fetch receipts, so only try if we're provided the guid.
        if (receiptGUID) {
            refreshOperations.push(dispatch(receiptsOperations.loadReceipt(receiptGUID)));
        }

        if (shouldClearCoupon) {
            refreshOperations.push(dispatch(shopOperations.clearCoupon()));
        }

        // Make sure to reload any cached user video queries since the draft and purchased video lists
        // were most likely both affected.
        apolloClient.refetchQueries({
            include: [accountPageUserVideosQueryName, lastEditedUserVideoInfoQueryName],
        });

        return Promise.all(refreshOperations);
    };

/**
 * Attempt to make a cart purchase with the (optional) provided payment info.
 * @param   {(object|null)}  [paymentInfo]  Info from payment form, or null.
 *          If `null` is passed, we will attempt to complete the purchase with
 *          whatever account information we have on file for the account.
 * @param   {boolean}  [shouldIncludePremiere]
 *          Whether or not to include a Premiere subscription along with the
 *          cart items in the purchase.
 * @returns {Promise}
 */
const attemptVideoCheckoutPurchase = (paymentInfo) => async (dispatch) => {
    // Start the attempt.
    const beforePurchaseState = dispatch(beginPurchaseAttempt());

    const {
        videoConfiguration: videoDescriptor
    } =
    selectors.getCheckoutPurchasingUserVideoInfo(beforePurchaseState);

    if (!videoDescriptor ? .__activeConfiguration) {
        // If there's not __activeconfiguration, this configuration is probably
        // in the old style. There isn't really a way for those old style configurations
        // to have shutterstock images in them, so we just won't worry about it
        console.warn('No active configuration found for video checkout purchase');
    } else {
        try {
            const imageAssetKeys = [];

            for (const configurationKey in videoDescriptor.__activeConfiguration) {
                const configurationEntry = videoDescriptor.__activeConfiguration[configurationKey];

                if (
                    configurationEntry ? .content ? .type === 'image' &&
                    configurationEntry ? .content ? .location ? .key
                ) {
                    imageAssetKeys.push(configurationEntry.content.location.key);
                }
            }

            const videoStockImages = await getStockImagesForImageKeys(imageAssetKeys);

            if (!_.isEmpty(videoStockImages)) {
                await ShutterstockService.licenseImages(
                    videoStockImages.map(({
                        stockAssetId,
                        stockSearchId
                    }) => ({
                        sourceAssetID: stockAssetId,
                        searchID: stockSearchId,
                    })),
                    AssetLicensePurpose.Render,
                );
            }
        } catch (err) {
            dispatch(
                purchaseActions.failedPurchaseAttempt({
                    errorMessage: 'Failed to license stock images for purchase',
                }),
            );
            throw new PurchaseException('Failed to license stock images for video purchase');
        }
    }

    const emailAddress = _.isEmpty(paymentInfo) ? null : paymentInfo.emailAddress;

    // Whether we want to validate the account's payment source for this purchase
    // This will only be false if the purchase's subtotal is $0 after applying credits but before applying coupons
    // In such cases, we'll simply bypass Stripe and just let the user download their video
    // Breakdown for different scenarios:
    // 1. User buys a normal video - total without coupons > 0 -> will validate
    // 2. User buys a normal video with a coupon that brings the balance to 0 - total before coupon > 0 -> will still validate
    //    - NOTE: coupons have a "should_require_credit_card_for_purchase" field which is true by default, but in the rare
    //            instances that it's set to false, the purchase won't be validated if the balance is made 0 by the coupon
    // 3. User buys a video that has a $0 offer, ie a charity video - total without coupons == 0 -> will not validate
    // 4. User buys a video with a video credit - total without coupons == 0 -> will not validate
    //      - Note that this also allows partners/influencers who may not have cc info stored to skip validation!

    const shouldValidatePaymentSource =
        selectors.shouldCheckoutPurchaseRequireCreditCard(beforePurchaseState);

    // If not validating payment source, paymentToken will not be used
    let paymentToken = null;

    // If we SHOULD validate the payment source, we'll do a basic check of the payment info fields
    // and then validate with Stripe to get a payment token for the purchase
    if (shouldValidatePaymentSource) {
        // Validate the payment
        const validation = await dispatch(validatePaymentInfo(paymentInfo));

        // If the validation catches an error with the payment info, throw an exception
        if (validation.isValidationError) {
            throw new PurchaseException('Invalid payment information.');
        }

        // Get payment token from the validation results
        ({
            paymentToken
        } = validation);
    }

    // Get or create the account
    const {
        isAccountError,
        account
    } = await dispatch(getOrCreateAccount(emailAddress));

    if (isAccountError) {
        throw new PurchaseException('Failed to create an account during purchase.');
    }

    const purchasePayload = PurchaseHelper.getCheckoutPurchasePayload(
        beforePurchaseState,
        paymentToken,
    );

    if (_.isEmpty(purchasePayload.purchased_offers)) {
        const error = {
            errorMessage: 'At least one purchased offer is required for purchase.',
        };
        dispatch(purchaseActions.failedPurchaseAttempt(error));
        throw new PurchaseException('Nothing to purchase.');
    }

    // Now we're ready
    try {
        const response = await purchase(purchasePayload);
        const receiptGUID = response.receipt.guid;

        // If the user purchased a subscription offer along with their video, ensure we track that conversion.
        if (selectors.getCheckoutPurchasingSubscriptionOfferInfo(beforePurchaseState)) {
            GoogleAdsService.trackConversion({
                conversionName: premiereSignupEvent,
                transactionID: receiptGUID,
            });
            trackFacebookPixelEvent(premiereSignupEvent);
        }

        await dispatch(checkoutOperations.onPurchaseSuccess(response));

        // Refresh the store state after purchase.
        await dispatch(refreshStoreAfterPurchase(account.guid, receiptGUID, false));

        // Clear the coupon with a delay so it doesn't get cleared until the purchase view has been transitioned out
        // This way, we can avoid having the UI briefly flash back to the undiscounted price since this could potentially
        // freak people out
        setTimeout(() => dispatch(shopOperations.clearCoupon()), 300);

        dispatch(completePurchaseAttempt(response, beforePurchaseState));
    } catch (error) {
        dispatch(purchaseActions.failedPurchaseAttempt(error));
        // Re-throw the error
        throw error;
    }
};

/**
 * Attempt to purchase an offer outside the context of the cart.
 * @param   {(object|null)}  [paymentInfo]  Info from payment form, or null.
 *          If `null` is passed, we will attempt to complete the purchase with
 *          whatever account information we have on file for the account.
 * @param   {bool}          [shouldRedirectOnSuccess=true]    Whether we should redirect to the offer checkout success page upon successful purchase
 * @param   {object}        [offerItemConfiguration]          Optional configuration to provide for the offer item being purchased
 * @returns {Promise}
 */
const attemptOfferPurchase =
    ({
        paymentInfo,
        shouldRedirectOnSuccess = true,
        storeRefreshDelay = 0,
        offerItemConfiguration = {},
        accountGroupInviteCode = null,
    } = {}) =>
    async (dispatch, getState) => {
        // Start the attempt.
        const beforePurchaseState = dispatch(beginPurchaseAttempt());

        // Check if we should validate the provided payment info - we don't need to for
        // coupons that don't require credit cards or if the offer being purchased is totally free
        const shouldValidatePaymentSource =
            selectors.shouldOfferCheckoutPurchaseRequireCreditCard(beforePurchaseState);

        let paymentToken = null;

        // If we SHOULD validate the payment source, we'll do a basic check of the payment info fields
        // and then validate with Stripe to get a payment token for the purchase
        if (shouldValidatePaymentSource) {
            // Validate the payment
            const validation = await dispatch(validatePaymentInfo(paymentInfo));

            // If the validation catches an error with the payment info, throw an exception
            if (validation.isValidationError) {
                throw new PurchaseException('Invalid payment information.');
            }

            // Get payment token from the validation results
            ({
                paymentToken
            } = validation);
        }

        const {
            emailAddress,
            companyName
        } = paymentInfo ? ? {};

        // Get or create the account
        const {
            account,
            isAccountError,
            isExistingAccount
        } = await dispatch(
            getOrCreateAccount(emailAddress, companyName, accountGroupInviteCode),
        );

        if (isAccountError) {
            throw new PurchaseException('Failed to create an account during purchase.');
        }

        const inviteCode = isExistingAccount ? accountGroupInviteCode : null;

        const purchasePayload = PurchaseHelper.getOfferPurchasePayload(
            getState(),
            account,
            paymentToken,
            offerItemConfiguration,
            inviteCode,
        );

        if (_.isEmpty(purchasePayload.purchased_offers)) {
            const error = {
                errorMessage: 'An item is required for purchase.',
            };
            dispatch(purchaseActions.failedPurchaseAttempt(error));
            throw new PurchaseException('Nothing to purchase.');
        }

        // Now we're ready
        try {
            const response = await purchase(purchasePayload);
            const receiptGUID = response.receipt.guid || '';

            if (storeRefreshDelay) {
                // Delay clearing offers and refreshing the store to prevent the price from
                // flashing while we're transitioning away from the purchase view
                setTimeout(() => {
                    // Refresh the store state after purchase.
                    dispatch(refreshStoreAfterPurchase(account.guid, receiptGUID));

                    // Now that the offer has been purchased we can clear that guy right out.
                    dispatch(offerActions.clearSelectedOffers());
                }, storeRefreshDelay);
            } else {
                // Refresh the store state after purchase.
                await dispatch(refreshStoreAfterPurchase(account.guid, receiptGUID));

                // Now that the offer has been purchased we can clear that guy right out.
                dispatch(offerActions.clearSelectedOffers());
            }

            dispatch(completePurchaseAttempt(response, beforePurchaseState));

            const parsedQueryParams = parseQueryParams();

            // If a query param was provided for the redirect path on checkout success, go there
            if (parsedQueryParams.success) {
                // Using window.location.href to ensure we hit the server when we load this
                window.location.href = parsedQueryParams.success;
            } else if (shouldRedirectOnSuccess) {
                // If no success path was provided, just default to the normal checkout success page
                goToInternalURL(
                    appURLs.offerCheckoutSuccess(receiptGUID),
                    false,
                    // Clear query params now that the purchase is complete
                    null,
                );
            }
        } catch (error) {
            dispatch(purchaseActions.failedPurchaseAttempt(error));
            throw new PurchaseException(error.errorMessage);
        }
    };

/**
 * Attempt to purchase a premiere subscription with the (optionally) provided
 * payment information.
 * @param   {(object|null)}  [paymentInfo]  Info from payment form, or null.
 *          If `null` is passed, we will attempt to complete the purchase with
 *          whatever account information we have on file for the account.
 * @return {Promise}
 */
const attemptPremierePurchase = (paymentInfo) => async (dispatch, getState) => {
    // Start the attempt.
    const beforePurchaseState = dispatch(beginPurchaseAttempt());

    // We don't want people to purchase if they've already got Premiere.
    if (selectors.hasPremiereSubscription(getState())) {
        const error =
            'It looks like you already have Premiere! Start shopping to use your video credits.';
        dispatch(
            purchaseActions.failedPurchaseAttempt({
                errorMessage: error,
            }),
        );
        return;
    }

    // Validate the payment
    const {
        isValidationError,
        paymentToken
    } = await dispatch(validatePaymentInfo(paymentInfo));
    if (isValidationError) {
        throw new PurchaseException('Invalid payment information.');
    }

    const emailAddress = _.isEmpty(paymentInfo) ? null : paymentInfo.emailAddress;

    // Get or create the account
    const {
        isAccountError,
        account
    } = await dispatch(getOrCreateAccount(emailAddress));
    if (isAccountError) {
        throw new PurchaseException('Failed to create an account during purchase.');
    }

    const purchasePayload = PurchaseHelper.getPremierePurchasePayload(
        getState(),
        account,
        paymentToken,
    );

    // Now we're ready
    try {
        const response = await purchase(purchasePayload);
        const receiptGUID = response.receipt.guid;

        // Track the premiere signup conversion in Facebook and Google.
        GoogleAdsService.trackConversion({
            conversionName: premiereSignupEvent,
            transactionID: receiptGUID,
        });
        trackFacebookPixelEvent(premiereSignupEvent);

        // Refresh the store state after purchase.
        await dispatch(refreshStoreAfterPurchase(account.guid, receiptGUID));

        dispatch(completePurchaseAttempt(response, beforePurchaseState));

        goToInternalURL(appURLs.subscriptionCheckoutSuccess(receiptGUID));
    } catch (error) {
        console.error(error);
        dispatch(purchaseActions.failedPurchaseAttempt(error));
    }
};

const attemptPremiereUpsellPurchase = () => async (dispatch, getState) => {
    // Start the attempt.
    const beforePurchaseState = dispatch(beginPurchaseAttempt());
    const storeState = getState();

    // We don't want people to purchase if they've already got Premiere. Really, these people
    // shouldn't be seeing the Premiere upsell offering at all. But just to be safe...
    if (selectors.hasPremiereSubscription(storeState)) {
        dispatch(
            purchaseActions.failedPremiereUpsellPurchase({
                errorMessage: 'It looks like you already have Premiere! Start shopping to use your video credits.',
            }),
        );
        return;
    }

    const account = selectors.getAccount(storeState);

    // If we're here, the user just completed a purchase, so we know we have valid payment
    // info for them, and therefore we won't pass a payment token.
    const purchasePayload = PurchaseHelper.getPremiereUpsellPurchasePayload(storeState, account);

    // Now we're ready
    try {
        const response = await purchase(purchasePayload);

        // Track the premiere signup conversion in Facebook and Google.
        GoogleAdsService.trackConversion({
            conversionName: premiereSignupEvent,
            transactionID: response.receipt.guid,
        });
        trackFacebookPixelEvent(premiereSignupEvent);

        // Refresh the store state after purchase.
        await dispatch(refreshStoreAfterPurchase(account.guid));

        dispatch(completePurchaseAttempt(response, beforePurchaseState));
        dispatch(purchaseActions.completedPremiereUpsellPurchase());
    } catch (error) {
        console.error(error);
        dispatch(purchaseActions.failedPremiereUpsellPurchase(error));
    }
};

const FIELD_ERROR_KEY_MAP = {
    card_number: 'cardNumber',
    card_expiry_month: 'cardExpiryMonth',
    card_expiry_year: 'cardExpiryYear',
    card_cvc: 'cardCVV',
};

/**
 * Attempt to update the credit card info for an account.
 * @param   {string}  accountGUID  GUID for the account attempting a payment update
 * @param   {Object}  paymentInfo  Info from payment form, or null.
 * @returns {Promise}
 */
const attemptCardUpdate = (accountGUID, paymentInfo) => async (dispatch) => {
    if (_.isEmpty(paymentInfo)) {
        console.error('Invalid payment information.');
        throw new Error('No payment info provided.');
    }

    // Validate the payment info
    const {
        error,
        isValidationError,
        paymentToken
    } = await dispatch(
        validatePaymentInfo(paymentInfo),
    );

    if (isValidationError) {
        console.error('Invalid payment information.');

        throw error;
    }

    try {
        await updatePaymentInfo(accountGUID, {
            payment_token: paymentToken,
        });
    } catch (updatePaymentError) {
        /*
         * A payment error field error set will be formatted like:
         * {
         *   card_cvc: 'description',
         *   card_number: 'description',
         *   ...
         * }
         *
         * However, we expect a format like:
         * {
         *   cardCVV: true,
         *   cardNumber: true,
         *   ...
         * }
         *
         * So, let's implement that formatting if necessary.
         */
        if (updatePaymentError.fieldErrors) {
            updatePaymentError.fieldErrors = Object.keys(updatePaymentError.fieldErrors).reduce(
                (accum, key) => {
                    const fieldErrorKey = FIELD_ERROR_KEY_MAP[key];
                    return Object.assign(accum, {
                        [fieldErrorKey]: true,
                    });
                }, {},
            );
        }

        throw updatePaymentError;
    }

    // Refresh the loaded account and related info. Although we haven't made a purchase,
    // we still need to do this because the account credit card details have changed.
    await dispatch(refreshStoreAfterPurchase(accountGUID));
};

export default {
    attemptVideoCheckoutPurchase,
    attemptOfferPurchase,
    attemptPremierePurchase,
    attemptPremiereUpsellPurchase,
    refreshStoreAfterPurchase,
    attemptCardUpdate,
};