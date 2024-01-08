// Local
import GoogleAdsService from 'app/services/GoogleAdsService.js';
import {
    addToCartEvent
} from 'app/constants/ConversionEvents.js';
import {
    trackFacebookPixelEvent
} from 'app/utils/facebookPixel.js';
import {
    appURLs
} from 'app/constants/urls.js';
import {
    goToInternalURL
} from 'app/utils/urls.js';
import {
    freeVideoDownloadSubscriptionSlug,
    freeVideoDownloadSlug
} from 'app/constants/Offer.js';
import {
    checkoutPhases
} from 'app/constants/Checkout.js';
import {
    uuid
} from 'shared/utils/uuid.js';
import * as selectors from 'app/state/selectors/index.js';
import userVideoOperations from '../userVideos/operations.js';
import variantOperations from '../variants/operations.js';
import purchasedVideoProductOperations from '../purchasedVideoProducts/operations.js';
import configuredVideoOperations from '../configuredVideos/operations.js';
import savedDraftActions from '../savedDrafts/actions.js';
import purchaseActions from '../purchase/actions.js';
import actions from './actions.js';

/**
 * Handles "going back" when the user clicks the back button in the checkout flow
 */
const goBackInCheckoutFlow = () => (dispatch, getState) => {
    const storeState = getState();

    // Clear any purchase attempt that may have been made so that we can start fresh with no
    // field errors next time the user opens the purchase phase
    dispatch(purchaseActions.clearPurchaseAttempt());

    // If we have a specific previous URL we should return to, let's go to that -
    // otherwise, just default to the "My Videos" page
    const previousURL = selectors.getPreviousURL(storeState) || appURLs.accountVideos;

    goToInternalURL(previousURL, true);
};

/**
 * Automatically selects the appropriate offer for purchasing the user video based on if the user has video credits,
 * if they're buying a subscription, or if they're just buying a-la-carte
 */
const setupVideoOfferForPurchase = () => (dispatch, getState) => {
    const storeState = getState();

    const videoOfferPurchaseInfo = {};

    const hasActiveSubscription = selectors.hasActiveSubscription(storeState);
    const usesCredit = !hasActiveSubscription || selectors.doesPurchaseUseCredits(storeState);

    // Let's get all of the user's subscriptions and check if any of them have credits available
    // that we can apply to the purchase (if the user doesn't have any, this will be an empty array)
    const allSubscriptions = selectors.getAllSubscriptionContexts(storeState);
    for (let i = 0, numSubscriptions = allSubscriptions.length; i < numSubscriptions; i += 1) {
        const subscription = allSubscriptions[i];

        if (subscription.total_remaining_downloads > 0 || subscription.is_unlimited || !usesCredit) {
            // If the user has a credit we can use or this is a free video, let's set up the free download offer
            // for our offer purchase info
            const creditOffer = selectors.getOfferBySlug(
                storeState,
                subscription.free_download_offer_slug || freeVideoDownloadSubscriptionSlug,
            );
            // Since we're using a credit, we need to link the video offer to
            // the subscription product via its offer item token
            const linkedOfferItemToken = subscription.offer_item_token;

            videoOfferPurchaseInfo.creditOfferInfo = {
                offerSlug: creditOffer.slug,
                offerGUID: creditOffer.guid,
                offerItemGUID: creditOffer.offer_items[0].guid,
                offerPricings: creditOffer.offer_pricings,
                linkedOfferItemToken,
                appliedCreditCount: usesCredit ? 1 : 0,
            };
            break;
        }
    }

    const hasUnlimitedDownloads = selectors.hasUnlimitedDownloads(storeState);

    // Enterprise users can have unlimited credits without a subscription. If that's the case,
    // set up a credit offer similar to a used subscription credit, but using the video download
    // offer that is not linked to a subscription or pack.
    if (!videoOfferPurchaseInfo.creditOfferInfo && hasUnlimitedDownloads) {
        const unlimitedCreditOffer = selectors.getOfferBySlug(storeState, freeVideoDownloadSlug);

        videoOfferPurchaseInfo.creditOfferInfo = {
            offerSlug: unlimitedCreditOffer.slug,
            offerGUID: unlimitedCreditOffer.guid,
            offerItemGUID: unlimitedCreditOffer.offer_items[0].guid,
            offerPricings: unlimitedCreditOffer.offer_pricings,
            appliedCreditCount: usesCredit ? 1 : 0,
        };
    }

    if (!videoOfferPurchaseInfo.creditOfferInfo) {
        // If we don't have a credit offer yet, the user either doesn't have a subscription or doesn't
        // have enough credits
        // If the user has selected a subscription to purchase, let's check if the video
        // should be free with the purchase - if so, we'll use our stock free download slug
        const selectedSubscriptionOffer =
            selectors.getCheckoutPurchasingSubscriptionOfferInfo(storeState);

        if (selectedSubscriptionOffer) {
            for (
                let i = 0, numSubscriptionOfferItems = selectedSubscriptionOffer.offerItems.length; i < numSubscriptionOfferItems; i += 1
            ) {
                const subscriptionOfferItem = selectedSubscriptionOffer.offerItems[i];

                if (subscriptionOfferItem.allowedDownloads || subscriptionOfferItem.isUnlimited) {
                    const creditOffer = selectors.getOfferBySlug(
                        storeState,
                        freeVideoDownloadSubscriptionSlug,
                    );
                    // Since we're using a credit from the subscription, we need to link the video offer to
                    // the subscription product via its offer item token
                    const linkedOfferItemToken = subscriptionOfferItem.token;

                    videoOfferPurchaseInfo.creditOfferInfo = {
                        offerSlug: creditOffer.slug,
                        offerGUID: creditOffer.guid,
                        offerItemGUID: creditOffer.offer_items[0].guid,
                        offerPricings: creditOffer.offer_pricings,
                        linkedOfferItemToken,
                    };
                    break;
                }
            }
        }
    }

    // Store our video offer purchase info
    dispatch(actions.setVideoOfferPurchaseInfo(videoOfferPurchaseInfo));

    // Change the checkout phase to purchase now that we're ready to go
    dispatch(actions.setCheckoutPhase(checkoutPhases.purchase));
};

/**
 * Selects a subscription offer for purchase from the checkout flow's plan selection page
 *
 * @param {string}  subscriptionOfferSlug   The offer slug for the subscription offer we're selecting
 */
const setupSubscriptionOfferForPurchase = (subscriptionOfferSlug) => async (dispatch, getState) => {
    const storeState = getState();

    const subscriptionOffer = selectors.getOfferBySlug(storeState, subscriptionOfferSlug);

    const subscriptionOfferItems = subscriptionOffer.offer_items.map((offerItem) => ({
        guid: offerItem.guid,
        // If the subscription offer item doesn't have a token, we can make our own - it doesn't matter as long
        // as the token is unique and it's included in both offer purchase payloads so we can link them
        token: offerItem.offer_item_token || uuid(),
        allowedDownloads: offerItem.configuration_data.allowed_downloads || 0,
        isUnlimited: offerItem.configuration_data.is_unlimited || false,
    }));

    await dispatch(
        actions.setSubscriptionOfferPurchaseInfo({
            offerSlug: subscriptionOfferSlug,
            offerGUID: subscriptionOffer.guid,
            offerItems: subscriptionOfferItems,
            offerPricings: subscriptionOffer.offer_pricings,
            selectedOfferPricingIndex: 0,
        }),
    );

    // Now that our subscription is selected, let's also select our video offer
    // based on that and then move to the checkout purchase phase
    dispatch(setupVideoOfferForPurchase());
};

/**
 * Sets the appropriate checkout phase based on if the user is logged in or has a subscription
 *
 * @param {string}  userVideoGUID   The guid for the user video that we are setting up
 *                                    the checkout flow to purchase
 */
const initializeCheckout = (userVideoGUID) => async (dispatch, getState) => {
    const storeState = getState();

    if (!selectors.isLoggedIn(storeState)) {
        // If the user isn't logged in, they shouldn't be on the checkout page - let's redirect them to Waymark AI
        goToInternalURL(appURLs.ai);
        return;
    }

    // Get the user video with the given guid
    const purchasingUserVideo = await dispatch(userVideoOperations.loadUserVideo(userVideoGUID));

    if (!purchasingUserVideo || purchasingUserVideo.isError || purchasingUserVideo.purchased_at) {
        // If the selected user video doesn't exist or it has already been purchased, the checkout flow got opened in a way that
        // it shouldn't have - let's redirect the user to the My Videos page
        goToInternalURL(appURLs.accountVideos, true);
        return;
    }

    // Track conversion event for analytics
    trackFacebookPixelEvent(addToCartEvent);
    GoogleAdsService.trackConversion({
        conversionName: addToCartEvent
    });

    const purchasingVideoVariantSlug = purchasingUserVideo.video_spec.variant_slug;
    // Load the video's variant in case it hasn't been retrieved yet
    const purchasingVideoVariant = await dispatch(
        variantOperations.loadVariant(purchasingVideoVariantSlug),
    );

    // Store the the user video we're purchasing
    dispatch(
        actions.selectUserVideoToPurchase({
            guid: purchasingUserVideo.guid,
            videoConfiguration: purchasingUserVideo.video_spec.configuration,
            variantGUID: purchasingVideoVariant.guid,
            usesCredit: purchasingUserVideo.uses_credit,
        }),
    );

    const shouldShowSubscriptionPricing = selectors.shouldShowSubscriptionPricing(storeState);
    if (shouldShowSubscriptionPricing) {
        const subscriptionOffer = selectors.getPurchasableCheckoutOffers(storeState);
        dispatch(setupSubscriptionOfferForPurchase(subscriptionOffer[0].slug));
    } else {
        // Otherwise just move to the checkout purchase phase
        dispatch(setupVideoOfferForPurchase());
    }
};

/**
 * Called upon a successful purchase to clean things up and show the user the success view
 * in the checkout flow
 */
const onPurchaseSuccess = (response) => async (dispatch, getState) => {
    const storeState = getState();

    const purchasingUserVideoGUID = selectors.getCheckoutPurchasingUserVideoGUID(storeState);

    const userVideoSavedDraft = selectors.getSavedDraftByUserVideoGUID(
        storeState,
        purchasingUserVideoGUID,
    );

    // If we have a saved draft, let's remove it from our app state on the frontend -
    // it is also being removed on the backend so it won't show up in our saved drafts on any subsequent loads
    if (userVideoSavedDraft) {
        // Remove the saved draft for our video now that it's been purchased successfully
        dispatch(savedDraftActions.removeFromSavedDrafts(userVideoSavedDraft));
    }

    // Reload the video that we just purchased
    await Promise.all([
        dispatch(
            purchasedVideoProductOperations.loadPurchasedVideoProductForUserVideo(
                purchasingUserVideoGUID,
            ),
        ),
        dispatch(configuredVideoOperations.loadConfiguredVideoForUserVideo(purchasingUserVideoGUID)),
        dispatch(userVideoOperations.loadUserVideo(purchasingUserVideoGUID, true)),
    ]);
};

export default {
    goBackInCheckoutFlow,
    initializeCheckout,
    setupSubscriptionOfferForPurchase,
    setupVideoOfferForPurchase,
    onPurchaseSuccess,
};