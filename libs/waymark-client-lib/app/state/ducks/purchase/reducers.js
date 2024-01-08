// Local
import {
    PURCHASE_ATTEMPT_CLEAR,
    PURCHASE_ATTEMPT_COMPLETE,
    PURCHASE_ATTEMPT_ERROR,
    PURCHASE_ATTEMPT_PENDING,
    PURCHASE_PREMIERE_UPSELL_COMPLETE,
    PURCHASE_PREMIERE_UPSELL_ERROR,
    SHOP_INITIALIZE_PENDING,
} from '../../actionTypes.js';

// Reducer
const DEFAULT_STATE = {
    isPurchaseInProgress: false,
    hasPurchasedPremiereUpsell: false,
    premiereUpsellCouponGUID: null,
    premiereUpsellError: {},
    error: {},
};

export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case SHOP_INITIALIZE_PENDING:
            return {
                ...state,
                premiereUpsellCouponGUID: action.payload.premiereUpsellCouponGUID,
            };

        case PURCHASE_ATTEMPT_PENDING:
            return {
                ...state,
                isPurchaseInProgress: true,
                error: {},
            };

        case PURCHASE_ATTEMPT_ERROR:
            return {
                ...state,
                isPurchaseInProgress: false,
                error: action.payload,
            };

        case PURCHASE_ATTEMPT_COMPLETE:
            return {
                ...state,
                isPurchaseInProgress: false,
                error: {},
            };

        case PURCHASE_PREMIERE_UPSELL_COMPLETE:
            return {
                ...state,
                isPurchaseInProgress: false,
                hasPurchasedPremiereUpsell: true,
                error: {},
            };

        case PURCHASE_PREMIERE_UPSELL_ERROR:
            return {
                ...state,
                isPurchaseInProgress: false,
                premiereUpsellError: action.payload,
            };

        case PURCHASE_ATTEMPT_CLEAR:
            return {
                ...DEFAULT_STATE,
                // Don't clear out the upsell coupon GUID after a purchase, as we'll need this
                // for the upsell offer that displays on the OfferCheckoutSuccessPage. This coupon
                // allows us to give the user Premiere with the first month *free*.
                premiereUpsellCouponGUID: state.premiereUpsellCouponGUID,
            };

        default:
            return state;
    }
};