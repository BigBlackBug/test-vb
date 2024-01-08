// Vendor
import _ from 'lodash';

// Local
import * as purchaseItemConstants from 'app/constants/PurchaseItem.js';
import {
    getPurchaseItemTypeFromOffer
} from 'app/state/ducks/offers/utils.js';
import {
    getOfferBySlug
} from 'app/state/ducks/offers/selectors.js';
import {
    getReceiptOffersForReceipt
} from 'app/state/ducks/receipts/selectors.js';

/**
 * Constructs purchasable item objects from the receipt for the provided GUID.
 * @param  {Object} state
 * @param  {string} receiptGUID
 * @return {PurchasableItem[]}
 */
// eslint-disable-next-line import/prefer-default-export
export const getPurchasableItemsFromReceipt = (state, receiptGUID) => {
    const receiptOffers = getReceiptOffersForReceipt(state, receiptGUID);
    return receiptOffers
        .map((receiptOffer) => {
            const amount = receiptOffer.amount ? Number(receiptOffer.amount) : null;
            const adjustedAmount = receiptOffer.adjusted_amount ?
                Number(receiptOffer.adjusted_amount) :
                null;

            const offer = getOfferBySlug(state, receiptOffer.offer);

            // If we don't have the offer here, we're probably in the process of
            // fetching it. We'll filter out this item until the offer is loaded.
            if (!offer) {
                return null;
            }

            const itemType = getPurchaseItemTypeFromOffer(offer);
            const isPack = itemType === purchaseItemConstants.itemTypes.pack;
            const hasDiscount = amount !== adjustedAmount;

            const purchasableItem = {
                preDiscountTotal: hasDiscount ? amount : null,
                slug: receiptOffer.offer,
                total: adjustedAmount,
                type: itemType,
            };

            if (isPack) {
                return {
                    ...purchasableItem,
                    labelSubtext: "Use anytime. Your credits don't expire.",
                    videoCredits: _.sumBy(receiptOffer.receipt_offer_items, 'allowed_downloads'),
                };
            }

            return purchasableItem;
        })
        .filter((item) => Boolean(item));
};