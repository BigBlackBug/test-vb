// Vendor
import _ from 'lodash';

// Local
import {
    globalizeSelector
} from 'app/utils/selectors.js';
import {
    stateKeys
} from 'app/constants/State.js';
import {
    intervals
} from 'app/constants/PurchaseItem.js';
import {
    subscriptionIntervalPriorities
} from 'app/constants/Checkout.js';
import {
    getPriceFromOffer
} from 'app/utils/purchase.js';

const localSelectors = {};

/**
 * Get all offers loaded into the state.
 * @param  {Object} state
 */
localSelectors.getOffers = (state) => state.items;

/**
 * Get offer by slug.
 * @param  {Object} state
 * @param  {string} slug  Offer slug
 */
localSelectors.getOfferBySlug = (state, slug) => _.find(state.items, {
    slug
});

/**
 * Get the current premiere subscription offer.
 * @param  {Object} state
 * @return {Offer} Premiere subscription Offer.
 */
localSelectors.getPremiereOffer = (state) => {
    const purchasableCheckoutOfferSlugs = localSelectors.getPurchasableCheckoutOfferSlugs(state);

    if (!_.isEmpty(purchasableCheckoutOfferSlugs)) {
        // For our purposes right now, the checkout configuration should only have one checkout offer
        // which will be the primary premiere subscription offer - in the future, there's a chance that we could
        // have multiple different kinds of premiere offers available throughout the checkout flow,
        // such as an unlimited subscription, a subscription with 1 credit/month, or 2 credits/month
        const premiereSubscriptionSlug = purchasableCheckoutOfferSlugs[0];
        return localSelectors.getOfferBySlug(state, premiereSubscriptionSlug);
    }

    return null;
};

/**
 * Get the current premiere subscription offer pricing for a given interval.
 * @param  {Object} state
 * @param  {String} interval
 * @return {OfferPricing} Premiere subscription OfferPricing, or 'undefined' if none.
 */
const getPremiereOfferPricingForInterval = (state, desiredInterval) => {
    const offer = localSelectors.getPremiereOffer(state);
    if (!offer) {
        return undefined;
    }

    return _.first(offer.offer_pricings.filter((item) => item.interval === desiredInterval));
};

/**
 * Get the current premiere subscription offer monthly price.
 * @param  {Object} state
 * @return {OfferPricing} Premiere subscription OfferPricing.
 */
localSelectors.getPremiereMonthlyOfferPricing = (state) =>
    getPremiereOfferPricingForInterval(state, intervals.month);

/**
 * Get the current premiere subscription offer yearly price.
 * @param  {Object} state
 * @return {Number} Premiere subscription Offer yearly price..
 */
localSelectors.getPremiereYearlyOfferPricing = (state) =>
    getPremiereOfferPricingForInterval(state, intervals.year);

/**
 * Get the price for the provided offer slug.
 * FIXME: This assumes only 1 offer_pricing per offer -- we're just returning the first one.
 * @param  {Object} state
 * @param  {string} slug           Offer slug
 * @param  {string} offerInterval  Optional interval to target specific offer pricing.
 * @return {number|null} Price of the provided offer, in USD, or null.
 */
localSelectors.getOfferPrice = (state, slug, offerInterval = null) => {
    const offer = localSelectors.getOfferBySlug(state, slug);

    return getPriceFromOffer(offer, offerInterval);
};

/**
 * Get the offer context for the offers in the state.
 * @param  {Object} state
 */
localSelectors.getOffersContext = (state) => state.accountOffersContext;

/**
 * Get whether we have fetched the account's offers context yet
 * @param {object}  state
 */
localSelectors.hasFetchedOffersContext = (state) => !_.isEmpty(state.accountOffersContext);

/**
 * Returns all currently selected offer slugs.
 * @param  {Object} state
 * @returns {Object[]} Array of serialized offer objects for selected offers.
 */
localSelectors.getSelectedOffers = (state) => state.selectedOffers;

/**
 * Get the loaded checkoutContext.
 * @param {object}    state
 * @return {object}   Checkout context.
 */
localSelectors.getCheckoutContext = (state) => state.checkoutContext;

/**
 * Get recurring video download subscription context for purchasing with
 * existing subscription credits.
 * @param  {Object} state
 */
localSelectors.getRecurringSubscriptionContext = (state) =>
    localSelectors.hasFetchedOffersContext(state) ?
    state.accountOffersContext.video_download_subscription_configured_products || [] :
    [];

/**
 * Get recurring video download subscription context for purchasing with
 * existing subscription credits.
 * @param  {Object} state
 */
localSelectors.getNonrecurringSubscriptionContext = (state) =>
    localSelectors.hasFetchedOffersContext(state) ?
    state.accountOffersContext.video_download_credits_configured_products || [] :
    [];

/**
 * Returns an array of both non-recurring and recurring subscription contexts
 * @param {Object}  state
 */
localSelectors.getAllSubscriptionContexts = (state) => [
    ...localSelectors.getNonrecurringSubscriptionContext(state),
    ...localSelectors.getRecurringSubscriptionContext(state),
];

/**
 * Returns whether product setup has been completed for all purchases for the active account.
 * NOTE that we are explicitly checking for `false` on purpose. For users who do not yet
 * have an account, there will be no 'accountOffersContext.is_configured_product_setup_complete'
 * present. But if `isProductSetupComplete === false`, we likely have stale offer and account
 * information in the store state.
 * @param  {Object} state
 */
localSelectors.isProductSetupComplete = (state) =>
    state.accountOffersContext.is_configured_product_setup_complete !== false;

/**
 * Returns whether the Offers for the current ShopState are currently
 * being fetched from the server.
 * @param  {Object} state
 */
localSelectors.isFetchingAllOffers = (state) => state.isFetchingAll;

/**
 * Returns whether the Offers for the current ShopState have been
 * fetched from the server.
 * @param  {Object} state
 */
localSelectors.hasFetchedAllOffers = (state) => state.hasFetchedAll;

/**
 * Based on outstanding or already-completed requests, returns whether to fetch
 * the Offers from the server.
 * @param  {Object} state
 */
localSelectors.shouldFetchAllOffers = (state) =>
    state.shouldRefetchData ||
    !(localSelectors.isFetchingAllOffers(state) || localSelectors.hasFetchedAllOffers(state));

/**
 * Get the slugs for all offers that are purchasable through the checkout flow from the checkout configuration
 * @param {Object}    state
 * @param {string[]}  purchasableCheckoutOfferSlugs   Slugs for all offers purchasable through checkout flow
 */
localSelectors.getPurchasableCheckoutOfferSlugs = (state) => {
    const checkoutContext = localSelectors.getCheckoutContext(state);

    return _.get(checkoutContext, 'checkout_offer_slugs', []);
};

/**
 * Gets the offer objects for all of the purchasable checkout offer slugs
 * @param {Object}  state
 */
localSelectors.getPurchasableCheckoutOffers = (state) => {
    const checkoutOfferSlugs = localSelectors.getPurchasableCheckoutOfferSlugs(state);

    // Merge the checkout offer contexts with their corresponding offers
    return checkoutOfferSlugs.map((offerSlug) => {
        const offer = localSelectors.getOfferBySlug(state, offerSlug);

        if (offer.offer_pricings.length > 1) {
            offer.offer_pricings.sort((pricing1, pricing2) => {
                const pricing1IntervalPriority = subscriptionIntervalPriorities[pricing1.interval] || 0;
                const pricing2IntervalPriority = subscriptionIntervalPriorities[pricing2.interval] || 0;

                // If we return a number > 0, pricing1 is higher priority and should come first
                // If we return 0, they're equal priority so we'll do nothing
                // If we return a number < 0, pricing2 is higher priority and should come first
                return pricing1IntervalPriority - pricing2IntervalPriority;
            });
        }

        return offer;
    });
};

/**
 * Returns the total available video credits for the account.
 * @param  {Object} state
 * @return {number} The number of video credits available to be used by the logged-in
 *                  account (or 0 if not logged in).
 */
localSelectors.getAccountVideoCreditCount = (state) => {
    const offerContext = localSelectors.getOffersContext(state);

    return !_.isEmpty(offerContext) ? offerContext.total_remaining_downloads : 0;
};

/**
 * Whether the user has a subscription with unlimited credits
 * @param {Object}  state
 * @return {bool}   Whether the user has an unlimited subscription
 */
localSelectors.hasUnlimitedDownloads = (state) => {
    const offerContext = localSelectors.getOffersContext(state);

    return Boolean(offerContext.has_unlimited);
};

/**
 * The max number of brands that can be saved on the user's account at one time.
 * If null, there is no limit.

 * @param {Object} state
 * @returns {number|null}
 */
localSelectors.maxSavedBrandCount = (state) => {
    const offerContext = localSelectors.getOffersContext(state);

    return _.get(offerContext, 'max_saved_brand_count', null);
};

/**
 * Returns an array of the allowed video render formats that the user can get their video in
 * as dictated by their subscription; if null, they have access to all default formats
 * @param {Object} state
 * @returns {RenderedVideoFormat[]|null}
 */
localSelectors.subscriptionAllowedVideoRenderQualities = (state) => {
    const offerContext = localSelectors.getOffersContext(state);

    return _.get(offerContext, 'allowed_render_qualities', null);
};

/**
 * Returns whether the user has a subscription which has permissions to make an approval request
 * for a video so that they can get explicit approval from their client on record for the video
 * @param {object}  state
 * @return {bool}   Whether the user has a subscription with client approval
 */
localSelectors.hasClientApprovalFeature = (state) => {
    const offerContext = localSelectors.getOffersContext(state);

    return Boolean(offerContext.has_video_approval);
};

/**
 * Returns whether the user has a subscription which has permissions to buy voice-overs for purchased videos
 * @param {object}  state
 * @return {bool}   Whether the user has a subscription with voice-over
 */
localSelectors.hasVoiceOverFeature = (state) => {
    const offerContext = localSelectors.getOffersContext(state);

    return Boolean(offerContext.has_voice_over);
};

/**
 * Returns whether the user has a subscription or account group which has permissions to use the concierge flow
 * @param {object} state
 * @return {bool}   Whether the user has a subscription/account group with concierge
 */
localSelectors.hasConciergeFeature = (state) => {
    const offerContext = localSelectors.getOffersContext(state);

    return Boolean(offerContext.has_concierge);
};

/**
 * Returns whether the user has an active subscription
 * @param {object}  state
 * @return {bool}   Whether the user has an active subscription
 */
localSelectors.hasActiveSubscription = (state) => {
    const offerContext = localSelectors.getOffersContext(state);

    return Boolean(offerContext.has_active_subscription);
};

export default localSelectors;

// Export global selectors.
const moduleName = 'offers';
const localPath = stateKeys[moduleName];

export const getAccountVideoCreditCount = globalizeSelector(
    localSelectors.getAccountVideoCreditCount,
    localPath,
);
export const getNonrecurringSubscriptionContext = globalizeSelector(
    localSelectors.getNonrecurringSubscriptionContext,
    localPath,
);
export const getPurchasableCheckoutOfferSlugs = globalizeSelector(
    localSelectors.getPurchasableCheckoutOfferSlugs,
    localPath,
);
export const getPurchasableCheckoutOffers = globalizeSelector(
    localSelectors.getPurchasableCheckoutOffers,
    localPath,
);
export const getAllSubscriptionContexts = globalizeSelector(
    localSelectors.getAllSubscriptionContexts,
    localPath,
);
export const getPremiereOffer = globalizeSelector(localSelectors.getPremiereOffer, localPath);
export const getPremiereMonthlyOfferPricing = globalizeSelector(
    localSelectors.getPremiereMonthlyOfferPricing,
    localPath,
);
export const getPremiereYearlyOfferPricing = globalizeSelector(
    localSelectors.getPremiereYearlyOfferPricing,
    localPath,
);
export const getOfferBySlug = globalizeSelector(localSelectors.getOfferBySlug, localPath);
export const getOffers = globalizeSelector(localSelectors.getOffers, localPath);
export const getOffersContext = globalizeSelector(localSelectors.getOffersContext, localPath);
export const hasFetchedOffersContext = globalizeSelector(
    localSelectors.hasFetchedOffersContext,
    localPath,
);
export const getCheckoutContext = globalizeSelector(localSelectors.getCheckoutContext, localPath);
export const getSelectedOffers = globalizeSelector(localSelectors.getSelectedOffers, localPath);
export const getRecurringSubscriptionContext = globalizeSelector(
    localSelectors.getRecurringSubscriptionContext,
    localPath,
);
export const hasFetchedAllOffers = globalizeSelector(localSelectors.hasFetchedAllOffers, localPath);
export const isFetchingAllOffers = globalizeSelector(localSelectors.isFetchingAllOffers, localPath);
export const isProductSetupComplete = globalizeSelector(
    localSelectors.isProductSetupComplete,
    localPath,
);
export const shouldFetchAllOffers = globalizeSelector(
    localSelectors.shouldFetchAllOffers,
    localPath,
);
export const getOfferPrice = globalizeSelector(localSelectors.getOfferPrice, localPath);
export const hasUnlimitedDownloads = globalizeSelector(
    localSelectors.hasUnlimitedDownloads,
    localPath,
);
export const maxSavedBrandCount = globalizeSelector(localSelectors.maxSavedBrandCount, localPath);
export const subscriptionAllowedVideoRenderQualities = globalizeSelector(
    localSelectors.subscriptionAllowedVideoRenderQualities,
    localPath,
);
export const hasClientApprovalFeature = globalizeSelector(
    localSelectors.hasClientApprovalFeature,
    localPath,
);
export const hasVoiceOverFeature = globalizeSelector(localSelectors.hasVoiceOverFeature, localPath);
export const hasConciergeFeature = globalizeSelector(localSelectors.hasConciergeFeature, localPath);
export const hasActiveSubscription = globalizeSelector(
    localSelectors.hasActiveSubscription,
    localPath,
);