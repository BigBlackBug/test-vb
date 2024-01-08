// Local
import {
    replaceOrAdd
} from 'shared/utils/collections.js';
// Local
import {
    CONFIGURED_VIDEOS_RECEIVED_ALL_FOR_ACCOUNT,
    CONFIGURED_VIDEOS_RECEIVED_VIDEO,
} from '../../actionTypes.js';

// Reducer
export const DEFAULT_STATE = {
    loadedForAccountGUID: null,
    items: [
        // Serialized ConfiguredVideo records.
    ],
};

export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case CONFIGURED_VIDEOS_RECEIVED_ALL_FOR_ACCOUNT:
            return {
                ...state,
                loadedForAccountGUID: action.payload.accountGUID,
                items: replaceOrAdd(state.items, action.payload.configuredVideos, 'guid'),
            };

        case CONFIGURED_VIDEOS_RECEIVED_VIDEO:
            return {
                ...state,
                items: replaceOrAdd(state.items, action.payload, 'guid'),
            };

        default:
            return state;
    }
};