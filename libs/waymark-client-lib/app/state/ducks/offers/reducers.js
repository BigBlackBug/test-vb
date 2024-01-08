// Local
import {
    replaceOrAdd
} from 'shared/utils/collections.js';
import {
    OFFERS_CLEAR,
    OFFERS_FETCH_COMPLETE,
    OFFERS_FETCH_ERROR,
    OFFERS_FETCH_PENDING,
    OFFERS_SELECT_OFFER,
    OFFERS_CLEAR_OFFER,
    OFFERS_UPDATE_OFFER_CONTEXT,
    SHOP_SET_SHOULD_REFETCH,
} from 'app/state/actionTypes.js';

// Reducer
export const DEFAULT_STATE = {
    isFetchingAll: false,
    hasFetchedAll: false,
    shouldRefetchData: false,
    error: '',
    items: [
        // Serialized Offer records.
    ],
    accountOffersContext: {},
    checkoutContext: {},
    selectedOffers: [],
};

export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case OFFERS_FETCH_PENDING:
            return {
                ...state,
                isFetchingAll: true,
                hasFetchedAll: false,
            };

        case OFFERS_FETCH_ERROR:
            return {
                ...state,
                isFetchingAll: false,
                hasFetchedAll: false,
                error: action.payload,
            };

        case OFFERS_FETCH_COMPLETE:
            return {
                ...state,
                isFetchingAll: false,
                hasFetchedAll: true,
                shouldRefetchData: false,
                items: replaceOrAdd(state.items, action.payload.offers, 'guid'),
                accountOffersContext: action.payload.account_offers_context,
                checkoutContext: action.payload.checkout_context,
            };

        case OFFERS_UPDATE_OFFER_CONTEXT:
            return {
                ...state,
                accountOffersContext: action.payload,
            };

        case SHOP_SET_SHOULD_REFETCH:
            return {
                ...state,
                shouldRefetchData: true,
            };

        case OFFERS_CLEAR:
            return DEFAULT_STATE;

        case OFFERS_SELECT_OFFER:
            return {
                ...state,
                selectedOffers: [].concat(state.selectedOffers, action.payload),
            };

        case OFFERS_CLEAR_OFFER:
            return {
                ...state,
                selectedOffers: [],
            };

        default:
            return state;
    }
};