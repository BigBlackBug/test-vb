// Local
import {
    globalizeSelector
} from 'app/utils/selectors.js';
import {
    stateKeys
} from 'app/constants/State.js';

const localSelectors = {};

/**
 * Returns info about the user video that is selected for purchase in chekcout
 *
 * @param {object}  state
 */
localSelectors.getCheckoutPurchasingUserVideoInfo = (state) => state.purchasingUserVideoInfo;

/**
 * Returns the guid of the user video that is selected for purchase in checkout
 *
 * @param {object}  state
 */
localSelectors.getCheckoutPurchasingUserVideoGUID = (state) =>
    localSelectors.getCheckoutPurchasingUserVideoInfo(state).guid;

/**
 * Returns info about the video download offer we're purchasing for the selected video
 *
 * @param {object}  state
 */
localSelectors.getCheckoutVideoOffers = (state) => state.purchasingVideoOfferInfo;

/**
 * Returns info about the subscription offer we're purchasing, if one was selected
 *
 * @param {object}  state
 */
localSelectors.getCheckoutPurchasingSubscriptionOfferInfo = (state) =>
    state.purchasingSubscriptionOfferInfo;

/**
 * Returns whether the user has selected a subscription to purchase
 */
localSelectors.isPurchasingSubscription = (state) => Boolean(state.purchasingSubscriptionOfferInfo);

/**
 * Returns the subscription offer pricing object which is currently selected for purchase
 *
 * @param {object}  state
 */
localSelectors.getSelectedSubscriptionOfferPricing = (state) => {
    const selectedSubscriptionOffer =
        localSelectors.getCheckoutPurchasingSubscriptionOfferInfo(state);

    // If there isn't a subscription offer, just return null
    if (!selectedSubscriptionOffer) {
        return null;
    }

    // Return the offer pricing at the selected index
    const selectedOfferPricingIndex = selectedSubscriptionOffer.selectedOfferPricingIndex || 0;
    return selectedSubscriptionOffer.offerPricings[selectedOfferPricingIndex];
};

/**
 * Returns the current phase that the checkout is in
 *
 * @param {object}  state
 */
localSelectors.getCurrentCheckoutPhase = (state) => state.checkoutPhase;

/**
 * Returns the previous URL to return to if the user prematurely closes the checkout flow
 *
 * @param {object}  state
 */
localSelectors.getPreviousURL = (state) => state.previousURL;

/**
 * Returns whether the selected video purchase uses credits
 */
localSelectors.doesPurchaseUseCredits = (state) =>
    Boolean(state.purchasingUserVideoInfo.usesCredit);

export default localSelectors;

// Export global selectors.
const localPath = stateKeys.checkout;

export const getCheckoutPurchasingUserVideoInfo = globalizeSelector(
    localSelectors.getCheckoutPurchasingUserVideoInfo,
    localPath,
);
export const getCheckoutPurchasingUserVideoGUID = globalizeSelector(
    localSelectors.getCheckoutPurchasingUserVideoGUID,
    localPath,
);
export const getCheckoutVideoOffers = globalizeSelector(
    localSelectors.getCheckoutVideoOffers,
    localPath,
);
export const getCheckoutPurchasingSubscriptionOfferInfo = globalizeSelector(
    localSelectors.getCheckoutPurchasingSubscriptionOfferInfo,
    localPath,
);
export const isPurchasingSubscription = globalizeSelector(
    localSelectors.isPurchasingSubscription,
    localPath,
);
export const getSelectedSubscriptionOfferPricing = globalizeSelector(
    localSelectors.getSelectedSubscriptionOfferPricing,
    localPath,
);
export const getCurrentCheckoutPhase = globalizeSelector(
    localSelectors.getCurrentCheckoutPhase,
    localPath,
);
export const getPreviousURL = globalizeSelector(localSelectors.getPreviousURL, localPath);
export const doesPurchaseUseCredits = globalizeSelector(
    localSelectors.doesPurchaseUseCredits,
    localPath,
);