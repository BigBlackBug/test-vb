// Vendor
import _ from 'lodash';

// Local
import {
    replaceOrAdd
} from 'shared/utils/collections.js';
import {
    SAVED_DRAFTS_ADD,
    SAVED_DRAFTS_FETCH_COMPLETE,
    SAVED_DRAFTS_FETCH_ERROR,
    SAVED_DRAFTS_FETCH_PENDING,
    SAVED_DRAFTS_REMOVE,
} from 'app/state/actionTypes.js';

// Reducer
const DEFAULT_STATE = {
    isFetchingAll: false,
    hasFetchedAll: false,
    error: '',
    items: [
        // Serialized SavedDraft records.
        // { user_video: 'guid', last_added_on: Date.now(), guid: '1234-3456-4556-4322' }
    ],
};

export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case SAVED_DRAFTS_FETCH_PENDING:
            return {
                ...state,
                isFetchingAll: true,
                hasFetchedAll: false,
            };

        case SAVED_DRAFTS_FETCH_ERROR:
            return {
                ...state,
                isFetchingAll: false,
                hasFetchedAll: false,
                error: action.payload,
            };

        case SAVED_DRAFTS_FETCH_COMPLETE:
            return {
                ...state,
                isFetchingAll: false,
                hasFetchedAll: true,
                items: replaceOrAdd(state.items, action.payload, 'guid'),
            };

        case SAVED_DRAFTS_ADD:
            return {
                ...state,
                items: replaceOrAdd(state.items, action.payload, 'guid'),
            };

        case SAVED_DRAFTS_REMOVE:
            return {
                ...state,
                items: _.reject(state.items, {
                    guid: action.payload.guid
                }),
            };

        default:
            return state;
    }
};