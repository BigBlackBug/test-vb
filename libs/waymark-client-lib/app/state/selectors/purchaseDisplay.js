// Vendor
import _ from 'lodash';

// Local
import {
    itemTypes
} from 'app/constants/PurchaseItem.js';
import {
    premierePackSlugSet,
    baseVoiceoverOfferSlug,
    freeVideoDownloadSlug,
} from 'app/constants/Offer.js';
import {
    getVideoCreditsForOffer
} from 'app/utils/purchase.js';
import {
    getPurchaseItemTypeFromOffer
} from 'app/state/ducks/offers/utils.js';
import {
    getOfferBySlug,
    getOfferPrice,
    getOffers,
    getPremiereOffer,
    getSelectedOffers,
    getAccountVideoCreditCount,
    hasUnlimitedDownloads,
    hasActiveSubscription,
} from 'app/state/ducks/offers/selectors.js';
import {
    getSelectedSubscriptionOfferPricing,
    getCheckoutVideoOffers,
    isPurchasingSubscription,
    doesPurchaseUseCredits,
    getCheckoutPurchasingSubscriptionOfferInfo,
    getCheckoutPurchasingUserVideoInfo,
} from 'app/state/ducks/checkout/selectors.js';
import {
    hasVideoDownloadSubscription,
    getRolePermissions,
} from 'app/state/ducks/accounts/selectors.js';
import {
    getActiveCoupon,
    getBrandingProfileIsInvoiced,
    isCreditCardRequiredForActiveCoupon,
} from 'app/state/ducks/shop/selectors.js';
import {
    getVariantOfferSlugByGUID
} from 'app/state/ducks/variants/selectors.js';
import {
    getPurchaseErrors,
    isPurchaseInProgress
} from 'app/state/ducks/purchase/selectors.js';
import {
    calculateAmountWithCoupon,
    getTotalFromItems
} from 'shared/utils/prices.js';

/**
 * @typedef {Object} Offer
 * @property {string} Offer.guid  GUID for the offer
 * @property {string} Offer.slug  Slug
 * @property {string} Offer.description  Description of the offer, e.g. "Waymark Video Download"
 * @property {array} Offer.offer_pricings   Pricing available for the offer
 * @property {array} Offer.offer_items  Items included in this offer
 */

/**
 * Provided an offer that corresponds to a video pack, construct the
 * purchasableItem payload.
 * @param  {object} packOffer
 * @return {(PurchasableItem | null)} Purchasable item for the selected pack, or null.
 */
export const getPurchasableItemFromOffer = (offer) => {
    if (!offer) return null;

    // TODO: Believe this is OneToOne -- we shouldn't need to nest this in an
    // array when this is serialized.
    const offerPricing = offer.offer_pricings[0];
    const purchaseItemType = getPurchaseItemTypeFromOffer(offer);
    const subText =
        purchaseItemType === itemTypes.pack ? "Use anytime. Your credits don't expire." : '';

    return {
        name: offer.display_name,
        type: purchaseItemType,
        labelSubtext: subText,
        slug: offer.slug,
        interval: offerPricing.interval,
        total: offerPricing.amount,
        videoCredits: getVideoCreditsForOffer(offer),
    };
};

/**
 * @typedef {Oject} Offer
 * @property {string} Offer.guid  GUID for the offer
 * @property {string} Offer.slug  Slug
 * @property {string} Offer.description  Description of the offer, e.g. "Waymark Video Download"
 * @property {array} Offer.offer_pricings   Pricing available for the offer
 * @property {array} Offer.offer_items  Items included in this offer
 */

/**
 * Get the purchasable item information for the premiere subscription.
 * @param  {Object} state
 * @return {PurchasableItem} Purchasable item for the Premiere subscription.
 */
export const getPremierePurchasableItem = (state) => {
    const premiereOffer = getPremiereOffer(state);

    return getPurchasableItemFromOffer(premiereOffer);
};

/**
 * Returns pack information to display on the pack pricing page, along with the
 * offer pricing and video credit count information.
 * @param  {Object} state
 * @return {PurchasableItem[]} List of purchasable packs to display on the cart page.
 */
export const getPurchasablePremierePacks = (state) => {
    const offers = getOffers(state);

    if (!offers.length) return [];

    const packOffersToDisplay = premierePackSlugSet.map((offerSlug) =>
        _.find(offers, {
            slug: offerSlug
        }),
    );

    const purchasablePacks = packOffersToDisplay.map((packOffer) =>
        getPurchasableItemFromOffer(packOffer),
    );

    // In the pack offer is still being fetched, let's not return an array filled with `null`.
    return purchasablePacks.filter((pack) => !_.isEmpty(pack));
};

/**
 * Returns the purchasable offers associated with all selected offers.
 * @param  {Object} state
 * @return {(PurchasableItem|Array)} PurchasableItem offers associated with the selected offers, or an empty array.
 */
export const getSelectedOfferPurchasableItems = (state) => {
    const selectedOffers = getSelectedOffers(state);

    // Map all selected offers to an array of PurchasableItems
    return selectedOffers.map((offer) => getPurchasableItemFromOffer(offer));
};

/**
 * Returns whether the user should be required to provide a credit card
 * for their offer purchase
 * @param {object} state
 */
export const shouldOfferCheckoutPurchaseRequireCreditCard = (state) => {
    // Invoiced purchases do not require a credit card.
    if (getBrandingProfileIsInvoiced(state)) {
        return false;
    }

    const purchasableItems = getSelectedOfferPurchasableItems(state);

    // Check if any of the items being purchased are subscriptions - if they are, we will always
    // require a CC since this will become a recurring charge
    const isPurchasingSubscriptionOffer = _.find(purchasableItems, {
        type: itemTypes.subscription
    });

    // Tally up item totals to get subtotal
    const subtotal = getTotalFromItems(purchasableItems);

    // Apply coupon to subtotal to receive total
    const activeCoupon = getActiveCoupon(state);
    const total = calculateAmountWithCoupon(subtotal, activeCoupon);

    /**
     * Require a card if:
     * the purchased offer isn't free AND
     * (
     *   the purchase total is greater than 0 after coupons OR
     *   a subscription is being purchsed OR
     *   the active coupon requires a card
     * )
     */
    return (
        subtotal > 0 &&
        (total > 0 || isPurchasingSubscriptionOffer || isCreditCardRequiredForActiveCoupon(state))
    );
};

/**
 * Returns info about the video download offer we're purchasing in the checkout flow
 * This will determine whether to use an a la carte offer or a credit offer which will use a credit.
 * This distinction is useful for scenarios where a user may apply a coupon which makes the video free,
 * meaning that we will not want to apply a coupon
 *
 * @param {object}  state
 */
export const getCheckoutVideoOfferPurchaseInfo = (state) => {
    const {
        creditOfferInfo,
        freeVideoOfferInfo
    } = getCheckoutVideoOffers(state);

    // If there is a freeVideoOffer it means that the user added a coupon for a free video
    // during checkout and it's the only offer we should attempt to purchase
    if (freeVideoOfferInfo) return freeVideoOfferInfo;

    if (creditOfferInfo) {
        return creditOfferInfo;
    }

    return null;
};

/**
 * Returns pricing object from the checkout's video offer that is currently being used
 *
 * @param {object} state
 */
export const getCheckoutVideoOfferPricing = (state) => {
    const videoOfferPurchaseInfo = getCheckoutVideoOfferPurchaseInfo(state);

    return videoOfferPurchaseInfo ? videoOfferPurchaseInfo.offerPricings[0] : null;
};

/**
 * Returns number of credits being applied for the checkout's video offer
 *
 * @param {object} state
 */
export const getCheckoutAppliedCreditCount = (state) => {
    // If the purchasing user video costs a credit, return 1;
    if (doesPurchaseUseCredits(state) && !isPurchasingSubscription(state)) return 1;

    const videoOfferPurchaseInfo = getCheckoutVideoOfferPurchaseInfo(state);
    return _.get(videoOfferPurchaseInfo, 'appliedCreditCount', 0);
};

/**
 * Returns the subtotal price for the checkout before any coupons are applied
 *
 * @param {object}  state
 */
export const getCheckoutSubtotal = (state) => {
    let subtotal = 0;

    const videoOfferPricing = getCheckoutVideoOfferPricing(state);
    subtotal += videoOfferPricing ? .amount || 0;

    const selectedSubscriptionOfferPricing = getSelectedSubscriptionOfferPricing(state);
    subtotal += selectedSubscriptionOfferPricing ? .amount || 0;

    return subtotal;
};

/**
 * Returns the total price amount for the currently selected checkout offers
 * after coupons are applied
 *
 * @param {object}  state
 * @param {number}  checkoutSubtotal
 */
export const getCheckoutTotalAfterCoupons = (state, checkoutSubtotal) => {
    const activeCoupon = getActiveCoupon(state);
    return calculateAmountWithCoupon(checkoutSubtotal, activeCoupon);
};

/**
 * Returns whether we should skip the offer selection checkout phase
 *
 * @param {object}  state
 */
export const shouldShowSubscriptionPricing = (state) =>
    !(
        hasVideoDownloadSubscription(state) ||
        // Skip if the user has credits, even if they don't have a subscription
        getAccountVideoCreditCount(state) > 0 ||
        hasUnlimitedDownloads(state) ||
        // Skip if the user has a special coupon which doesn't require a credit card
        // since we don't want them to be able to buy a subscription without a card
        !isCreditCardRequiredForActiveCoupon(state) ||
        // Skip if dealing with an invoiced customer
        getBrandingProfileIsInvoiced(state)
    );

/**
 * Returns whether the video being purchased through the checkout flow
 * has a free offer, meaning it should be able to be purchased for free without a
 * subscription or credit card
 *
 * @param {object}  state
 */
export const doesCheckoutVideoHaveFreeOffer = (state) => {
    const purchasingUserVideoInfo = getCheckoutPurchasingUserVideoInfo(state);

    const purchasingVideoVariantOfferSlug = getVariantOfferSlugByGUID(
        state,
        purchasingUserVideoInfo.variantGUID,
    );

    return purchasingVideoVariantOfferSlug === freeVideoDownloadSlug;
};

/**
 * Returns whether we should show the free video purchase flow in checkout because
 * the user is getting a video that is totally free and doesn't require a credit card or credits
 *
 * @param {object} state
 */
export const isCheckoutFreePurchase = (state) =>
    // We should show the free video purchase flow in checkout if the video has a free offer (meaning it's something like a free charity video)
    doesCheckoutVideoHaveFreeOffer(state) ||
    // We should also use the free purchase flow if a coupon is applied that
    // makes the video free and doesn't require a credit card
    !isCreditCardRequiredForActiveCoupon(state);

/**
 * Returns whether we should require a valid credit card to make a purchase,
 * meaning the user is either purchasing a subscription or directly purchasing a non-free video
 * with a card rather than a video credit
 *
 * @param {object} state
 */
export const shouldCheckoutPurchaseRequireCreditCard = (state) => {
    // Invoiced purchases do not require a credit card.
    if (getBrandingProfileIsInvoiced(state)) {
        return false;
    }

    // Require a credit card if we're purchasing a subscription; don't require a card
    // if we're purchasing a free video or are using video credits
    return (
        isPurchasingSubscription(state) ||
        (!isCheckoutFreePurchase(state) && !doesPurchaseUseCredits(state))
    );
};

/**
 * Returns the appropriate offer object to use in the voice-over checkout flow
 * based on if the account has a private offer in their account group which should
 * override the base VO offer
 *
 * @param {object} state
 */
export const getVoiceOverCheckoutOfferForAccount = (state) =>
    getOfferBySlug(state, baseVoiceoverOfferSlug);

/**
 * Returns the string formatted offer price for invoiced or regular offers.
 * @param  {object}   state
 * @param  {string}   offerSlug  Offer to inspect for pricing.
 */
export const getFormattedOfferPrice = (state, offerSlug) => {
    const offerPrice = getOfferPrice(state, offerSlug);

    if (offerPrice == null) {
        return null;
    }

    if (offerPrice <= 0) {
        return 'Free';
    }

    return `$${offerPrice}`;
};

/**
 * Returns whether or not a user has purchase permissions.
 * @param   {object}  state
 */
export const canUserPurchase = (state) => getRolePermissions(state) ? .can_purchase ? ? true;

/**
 * Configuration used to display and format the checkout purchase view.
 * Includes information about the purchasing user, the available subscription offer,
 * and checkout totals.
 *
 * @returns {Object}  checkoutConfiguration {
 *                      accountVideoCredits: Purchasing user's available credits,
 *                      hasActiveSubscription: Whether or not the user has an active subscription,
 *                      isUnlimited: If the user has an unlimited subscription, i.e. belongs to
 *                                   an account group with unlimited downloads,
 *                      subscriptionOffer: The current subscription available for purchase,
 *                      appliedVideoCreditCount: The amount of credits checkout will cost,
 *                      checkoutSubtotal: Price of purchase without discount,
 *                      checkoutTotal: Total amount due at purchase,
 *                      isFreePurchase: If the user is purchasing a free video or has applied a coupon that makes the purchase
 *                                      totally free,
 *                      isInvoicedCheckout: If user belongs to invoiced partner,
 *                      isPurchaseInProgress: If a purchase is currently in progress,
 *                      purchaseErrors: Errors caught during purchase call,
 *                    }
 */
export const getCheckoutPurchaseConfiguration = (state) => {
    const isUnlimited = hasUnlimitedDownloads(state);

    const checkoutSubtotal = getCheckoutSubtotal(state);
    const checkoutTotal = getCheckoutTotalAfterCoupons(state, checkoutSubtotal);

    return {
        // Purchaser info
        accountVideoCredits: isUnlimited ? 'Unlimited' : getAccountVideoCreditCount(state),
        hasActiveSubscription: hasActiveSubscription(state),
        isUnlimited,

        // Available offer
        subscriptionOffer: getCheckoutPurchasingSubscriptionOfferInfo(state),

        // Checkout state
        appliedVideoCreditCount: getCheckoutAppliedCreditCount(state),
        checkoutSubtotal,
        checkoutTotal,
        isFreePurchase: isCheckoutFreePurchase(state),
        isInvoicedCheckout: getBrandingProfileIsInvoiced(state),
        isPurchaseInProgress: isPurchaseInProgress(state),
        purchaseErrors: getPurchaseErrors(state),
        canPurchase: isCheckoutFreePurchase(state) || canUserPurchase(state),
    };
};