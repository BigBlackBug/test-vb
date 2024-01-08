// Local
import * as selectors from 'app/state/selectors/index.js';
import {
    uuid
} from 'shared/utils/uuid.js';

/**
 * Object for consolidating the purchase logic for offer and premiere checkouts
 */
const PurchaseHelper = {
    /**
     * Returns formatted purchase payload info for the currently selected video offer in checkout
     *
     * @param {object}  state
     * @param {string}  couponGUID    GUID for the currently applied coupon, if there is one
     */
    getFormattedVideoOfferForPurchase: (state, couponGUID) => {
        const userVideoInfo = selectors.getCheckoutPurchasingUserVideoInfo(state);
        const videoOfferPurchaseInfo = selectors.getCheckoutVideoOfferPurchaseInfo(state);

        if (!videoOfferPurchaseInfo) {
            return null;
        }

        const offerItemConfiguration = {
            configured_video_data: {
                video_template_variant: userVideoInfo.variantGUID,
                video_configuration: userVideoInfo.videoConfiguration,
            },
            user_video_guid: userVideoInfo.guid,
        };

        // If the video offer has a token for a linked offer item, add that to the configuration
        if (videoOfferPurchaseInfo.linkedOfferItemToken) {
            offerItemConfiguration.video_download_purchase_product_token =
                videoOfferPurchaseInfo.linkedOfferItemToken;
        }

        return {
            coupon_guid: couponGUID,
            offer_guid: videoOfferPurchaseInfo.offerGUID,
            offer_token: uuid(),
            offer_pricing_guid: selectors.getCheckoutVideoOfferPricing(state).guid,
            offer_items: [{
                offer_item_guid: videoOfferPurchaseInfo.offerItemGUID,
                offer_item_token: uuid(),
                configuration: offerItemConfiguration,
            }, ],
        };
    },
    /**
     * Returns formatted purchase payload info for the currently selected subscription offer in checkout
     * If no subscription is selected, it will just return null
     *
     * @param {object}  state
     * @param {string}  couponGUID    GUID for the currently applied coupon, if there is one
     */
    getFormattedSubscriptionOfferForPurchase: (state, couponGUID) => {
        const purchasingSubscriptionOffer = selectors.getCheckoutPurchasingSubscriptionOfferInfo(state);

        // If we're not purchasing a subscription, return null
        if (!purchasingSubscriptionOffer) {
            return null;
        }

        const selectedSubscriptionOfferPricing = selectors.getSelectedSubscriptionOfferPricing(state);

        return {
            coupon_guid: couponGUID,
            offer_guid: purchasingSubscriptionOffer.offerGUID,
            offer_token: uuid(),
            offer_pricing_guid: selectedSubscriptionOfferPricing.guid,
            offer_items: purchasingSubscriptionOffer.offerItems.map((offerItem) => ({
                offer_item_guid: offerItem.guid,
                offer_item_token: offerItem.token,
                configuration: {},
            })),
        };
    },
    /**
     * Returns an array of formatted offers for the checkout purchase payload
     *
     * @param {object}  state
     * @param {string}  couponGUID    GUID for the currently applied coupon, if there is one
     */
    getFormattedCheckoutOffersForPurchase: (state, couponGUID) => {
        const formattedVideoOffer = PurchaseHelper.getFormattedVideoOfferForPurchase(state, couponGUID);
        const formattedSubscriptionOffer = PurchaseHelper.getFormattedSubscriptionOfferForPurchase(
            state,
            couponGUID,
        );

        return [formattedVideoOffer].concat(
            formattedSubscriptionOffer ? [formattedSubscriptionOffer] : [],
        );
    },
    /**
     * Constructs a purchase payload for the selected offers in the checkout flow
     * @param {object}  state
     * @param {string}  [paymentToken]    Stripe token or null if using the existing
     *                                      credit card on file, using a credit, or buying a free video
     */
    getCheckoutPurchasePayload: (state, paymentToken = null) => ({
        account: selectors.getAccountGUID(state),
        shop_state: selectors.getShopStateGUID(state),
        purchase_method: 'store',
        purchased_offers: PurchaseHelper.getFormattedCheckoutOffersForPurchase(
            state,
            selectors.getActiveCouponGUID(state),
        ),
        payment_token: paymentToken,
        should_validate_payment_source: selectors.shouldCheckoutPurchaseRequireCreditCard(state),
        client_session_guid: selectors.getClientSessionGUID(state),
    }),

    /**
     * For the provided offer, translate the offer into the
     * purchased_offer format expected by the purchase API.
     * @param {object} offer
     * @param {(object|null)} coupon Coupon to apply to the purchase.
     * @param {object} [offerItemConfiguration]
     *        Optional configuration object to pass to the offerItem
     */
    formatOfferForPurchase: (offer, couponGUID, offerItemConfiguration = {}) => ({
        coupon_guid: couponGUID,
        offer_guid: offer.guid,
        offer_token: uuid(),
        offer_pricing_guid: offer.offer_pricings[0].guid,
        offer_items: [{
            offer_item_guid: offer.offer_items[0].guid,
            offer_item_token: uuid(),
            configuration: offerItemConfiguration,
        }, ],
    }),

    /**
     * Handles the payload construction for purchasing the selected offer
     * outside of the cart.
     * @param  {object} state
     * @param  {object} account
     * @param  {string || null} paymentToken    Stripe token or null if using the existing
     *                                  credit card on file.
     * @param  {object} [offerItemConfiguration={}]   Optional configuration object for the offer item
     * @param  {object} [accountGroupInviteCode=null] Optional unique code associated with an account group
     */
    getOfferPurchasePayload: (
        state,
        account,
        paymentToken = null,
        offerItemConfiguration = {},
        accountGroupInviteCode = null,
    ) => {
        const coupon = selectors.getActiveCoupon(state);
        const couponGUID = coupon ? coupon.guid : null;

        const offers = selectors.getSelectedOffers(state);
        const purchasedOffers = offers
            // Filter out any invalid offers
            .filter((offer) => offer != null)
            .map((offer) =>
                PurchaseHelper.formatOfferForPurchase(offer, couponGUID, offerItemConfiguration),
            );

        return PurchaseHelper.getPurchasePayload({
            account,
            purchasedOffers,
            state,
            paymentToken,
            shouldValidatePaymentSource: selectors.shouldOfferCheckoutPurchaseRequireCreditCard(state),
            accountGroupInviteCode,
        });
    },

    /**
     * Handles the payload construction for purchasing a premiere subscription.
     * @param  {object} state
     * @param  {object} account
     * @param  {string || null} paymentToken
     *          Stripe token or null if using the existing credit card on file.
     *          If `null` is passed, we will attempt to complete the purchase with
     *          whatever account information we have on file for the account.
     */
    getPremierePurchasePayload: (state, account, paymentToken = null) => {
        const premiereOffer = selectors.getPremiereOffer(state);
        const coupon = selectors.getActiveCoupon(state);
        const couponGUID = coupon ? coupon.guid : null;
        const purchasedOffers = [PurchaseHelper.formatOfferForPurchase(premiereOffer, couponGUID)];

        return PurchaseHelper.getPurchasePayload({
            account,
            purchasedOffers,
            state,
            paymentToken,
        });
    },

    /**
     * Construct the payload for the purchase upsell offer.
     * @param  {object} state
     * @param  {object} account
     * @param  {string || null} paymentToken
     *          Stripe token or null if using the existing credit card on file.
     *          If `null` is passed, we will attempt to complete the purchase with
     *          whatever account information we have on file for the account.
     */
    getPremiereUpsellPurchasePayload: (state, account, paymentToken = null) => {
        const premiereOffer = selectors.getPremiereOffer(state);
        const couponGUID = selectors.getPremiereUpsellCouponGUID(state);
        const purchasedOffers = [PurchaseHelper.formatOfferForPurchase(premiereOffer, couponGUID)];

        return PurchaseHelper.getPurchasePayload({
            account,
            purchasedOffers,
            state,
            paymentToken,
        });
    },

    /**
     * Composes the standard purchase payload along with the provided purchase options
     * and paymentToken.
     * @param   {object}    options   Object of payload options which include:
     *          {object}    options.account
     *          {array}     options.purchasedOffers
     *          {object}    options.state
     *          {string || null}  options.paymentToken
     *                            Stripe token or null if using the existing credit card on file.
     *                            If `null` is passed, we will attempt to complete the purchase with
     *                            whatever account information we have on file for the account.
     */
    getPurchasePayload: ({
        account,
        purchasedOffers,
        state,
        paymentToken = null,
        purchaseMethod = 'store',
        shouldValidatePaymentSource = true,
        accountGroupInviteCode = null,
    }) => ({
        account: account.guid,
        business: null,
        shop_state: selectors.getShopStateGUID(state),
        purchased_offers: purchasedOffers,
        purchase_method: purchaseMethod,
        payment_token: paymentToken,
        should_validate_payment_source: shouldValidatePaymentSource,
        client_session_guid: selectors.getClientSessionGUID(state),
        account_group_invite_code: accountGroupInviteCode,
    }),
};

export default PurchaseHelper;