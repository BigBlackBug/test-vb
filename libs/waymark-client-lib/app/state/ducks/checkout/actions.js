import {
    CHECKOUT_SELECT_VIDEO_TO_PURCHASE,
    CHECKOUT_SET_VIDEO_OFFER_PURCHASE_INFO,
    CHECKOUT_SET_SUBSCRIPTION_OFFER_PURCHASE_INFO,
    CHECKOUT_SELECT_SUBSCRIPTION_OFFER_PRICING_FOR_PURCHASE,
    CHECKOUT_APPLY_VIDEO_CREDIT_TO_PURCHASE,
    CHECKOUT_CLEAR,
    CHECKOUT_DESELECT_OFFERS,
    CHECKOUT_SET_PHASE,
    CHECKOUT_SET_PREVIOUS_URL,
} from 'app/state/actionTypes.js';

/**
 * Selects a user video to purchase in checkout
 * @param {object}  userVideoPurchaseInfo        Object with purchase info for the user video we're purchasing
 * @param {string}  userVideoPurchaseInfo.guid   The guid for the user video being purchased
 * @param {object}  userVideoPurchaseInfo.videoConfiguration    Configuration for the user video
 * @param {string}  variantGUID                   GUID for the video's variant
 */
const selectUserVideoToPurchase = (userVideoPurchaseInfo) => ({
    type: CHECKOUT_SELECT_VIDEO_TO_PURCHASE,
    payload: userVideoPurchaseInfo,
});

/**
 * Selects the offer that the user will be buying for their selected video
 * @param {object} offerInfo  Info about the video offer
 * @param {string} offerInfo.offerSlug        Slug for the video's offer
 * @param {string} offerInfo.offerItemGUIDs   GUIDs for the offer's offer items
 * @param {string} [linkedOfferItemToken]     Token that links this offer to another offer (ie, if making a purchase
 *                                                using credits from a subscription)
 * @param {object[]}  offerPricings           Array of offer pricing objects for the offer
 */
const setVideoOfferPurchaseInfo = (offerInfo) => ({
    type: CHECKOUT_SET_VIDEO_OFFER_PURCHASE_INFO,
    payload: offerInfo,
});

/**
 * Selects the subscription offer that the user will be buying along with their video
 * @param {object} offerInfo                  Info about the video offer
 * @param {string} offerInfo.offerSlug        Slug for the subscription offer
 * @param {string} offerInfo.offerItems       Info about subscription's offer items
 * @param {object[]} offerInfo.offerPricings  Array of offer pricing objects for the subscription offer
 * @param {number}  offerInfo.selectedOfferPricingIndex The index of the pricing in the offerPricings array which is selected to be
 *                                                        used for the purchase
 */
const setSubscriptionOfferPurchaseInfo = (offerInfo) => ({
    type: CHECKOUT_SET_SUBSCRIPTION_OFFER_PURCHASE_INFO,
    payload: offerInfo,
});

/**
 * Updates the index for the selected offer pricing to be used for our subscription purchase
 * @param {number}  offerPricingIndex   Index of the offer pricing in the subscription offer's offerPricings array
 */
const selectSubscriptionOfferPricingForPurchase = (offerPricingIndex) => ({
    type: CHECKOUT_SELECT_SUBSCRIPTION_OFFER_PRICING_FOR_PURCHASE,
    payload: offerPricingIndex,
});

/**
 * Indicates that we are using a video credit for our purchase
 */
const applyVideoCreditToPurchase = () => ({
    type: CHECKOUT_APPLY_VIDEO_CREDIT_TO_PURCHASE,
});

/**
 * Clears the currently selected user video/offer for checkout
 */
const clearCheckout = () => ({
    type: CHECKOUT_CLEAR,
});

/**
 * Deselects any selected checkout offers
 */
const deselectCheckoutOffers = () => ({
    type: CHECKOUT_DESELECT_OFFERS,
});

/**
 * Updates what phase the checkout flow is currently in
 * @param {string} newCheckoutPhase
 */
const setCheckoutPhase = (newCheckoutPhase) => ({
    type: CHECKOUT_SET_PHASE,
    payload: newCheckoutPhase,
});

/**
 * Sets the previous URL to return to if the user exits the checkout flow early
 * @param {string}  previousURL
 */
const setPreviousURL = (previousURL) => ({
    type: CHECKOUT_SET_PREVIOUS_URL,
    payload: previousURL,
});

export default {
    selectUserVideoToPurchase,
    setVideoOfferPurchaseInfo,
    setSubscriptionOfferPurchaseInfo,
    selectSubscriptionOfferPricingForPurchase,
    applyVideoCreditToPurchase,
    clearCheckout,
    deselectCheckoutOffers,
    setCheckoutPhase,
    setPreviousURL,
};