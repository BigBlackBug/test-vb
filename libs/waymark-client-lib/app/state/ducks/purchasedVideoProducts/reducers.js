// Local
import {
    replaceOrAdd
} from 'shared/utils/collections.js';
import {
    PURCHASED_VIDEO_PRODUCTS_FETCH_COMPLETE,
    PURCHASED_VIDEO_PRODUCTS_FETCH_ERROR,
    PURCHASED_VIDEO_PRODUCTS_FETCH_PENDING,
    PURCHASED_VIDEO_PRODUCT_UPDATE,
} from 'app/state/actionTypes.js';

// Reducer
export const DEFAULT_STATE = {
    isFetchingAll: false,
    hasFetchedAll: false,
    error: '',
    items: [
        // Serialized VideoDownloadProduct records.
        // { user_video: 'guid', guid: '1234-3456-4556-4322' }
    ],
};

export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case PURCHASED_VIDEO_PRODUCTS_FETCH_PENDING:
            return {
                ...state,
                isFetchingAll: true,
                hasFetchedAll: false,
            };

        case PURCHASED_VIDEO_PRODUCTS_FETCH_ERROR:
            return {
                ...state,
                isFetchingAll: false,
                hasFetchedAll: false,
                error: action.payload,
            };

        case PURCHASED_VIDEO_PRODUCTS_FETCH_COMPLETE:
            return {
                ...state,
                isFetchingAll: false,
                hasFetchedAll: true,
                items: replaceOrAdd(state.items, action.payload, 'guid'),
            };

        case PURCHASED_VIDEO_PRODUCT_UPDATE:
            return {
                ...state,
                items: replaceOrAdd(state.items, action.payload, 'guid'),
            };

        default:
            return state;
    }
};