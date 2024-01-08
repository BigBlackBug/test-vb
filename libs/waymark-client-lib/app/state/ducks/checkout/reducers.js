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
import {
    checkoutPhases
} from 'app/constants/Checkout.js';

export const DEFAULT_STATE = {
    purchasingUserVideoInfo: null,
    purchasingVideoOfferInfo: null,
    purchasingSubscriptionOfferInfo: null,
    appliedVideoCreditCount: 0,
    checkoutPhase: checkoutPhases.loading,
    previousURL: null,
};

export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case CHECKOUT_SELECT_VIDEO_TO_PURCHASE:
            return {
                ...state,
                purchasingUserVideoInfo: action.payload,
            };
        case CHECKOUT_SET_VIDEO_OFFER_PURCHASE_INFO:
            return {
                ...state,
                purchasingVideoOfferInfo: action.payload,
            };
        case CHECKOUT_SET_SUBSCRIPTION_OFFER_PURCHASE_INFO:
            return {
                ...state,
                purchasingSubscriptionOfferInfo: action.payload,
            };
        case CHECKOUT_SELECT_SUBSCRIPTION_OFFER_PRICING_FOR_PURCHASE:
            return {
                ...state,
                purchasingSubscriptionOfferInfo: state.purchasingSubscriptionOfferInfo ?
                    {
                        ...state.purchasingSubscriptionOfferInfo,
                        selectedOfferPricingIndex: action.payload,
                    } :
                    null,
            };
        case CHECKOUT_APPLY_VIDEO_CREDIT_TO_PURCHASE:
            return {
                ...state,
                appliedVideoCreditCount: 1,
            };
        case CHECKOUT_CLEAR:
            return DEFAULT_STATE;
        case CHECKOUT_DESELECT_OFFERS:
            return {
                ...state,
                purchasingVideoOfferInfo: null,
                purchasingSubscriptionOfferInfo: null,
                appliedVideoCreditCount: 0,
            };
        case CHECKOUT_SET_PHASE:
            return {
                ...state,
                checkoutPhase: action.payload,
            };
        case CHECKOUT_SET_PREVIOUS_URL:
            return {
                ...state,
                previousURL: action.payload,
            };
        default:
            return state;
    }
};