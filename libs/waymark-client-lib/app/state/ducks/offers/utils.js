// Local
import {
    itemTypesByProductTypeSlug
} from 'app/constants/PurchaseItem.js';

/**
 * Returns the appropriate purchase item type for the given offer.
 */
// eslint-disable-next-line import/prefer-default-export
export const getPurchaseItemTypeFromOffer = (offer) => {
    // TODO FIXME: This will break for offers with more than one item!
    const offerItem = offer.offer_items[0];
    return offerItem ? itemTypesByProductTypeSlug[offerItem.product_type] : null;
};