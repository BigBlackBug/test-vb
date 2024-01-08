// Local
import {
    replaceOrAdd,
    removePropertyFromCollection
} from 'shared/utils/collections.js';
import {
    USER_VIDEO_ADD,
    USER_VIDEO_FETCH_COMPLETE,
    USER_VIDEO_FETCH_ERROR,
    USER_VIDEO_FETCH_PENDING,
    USER_VIDEO_FETCH_ALL_PENDING,
    USER_VIDEO_FETCH_ALL_COMPLETE,
    USER_VIDEO_FETCH_ALL_ERROR,
    USER_VIDEO_UPDATE,
} from '../../actionTypes.js';

const DEFAULT_STATE = {
    hasFetchedAllForAccount: false,
    isFetchingAllForAccount: false,
    itemsBeingFetched: [],
    error: '',
    items: [],
};

export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case USER_VIDEO_ADD:
        case USER_VIDEO_UPDATE:
            return {
                ...state,
                items: replaceOrAdd(state.items, action.payload, 'guid'),
            };

        case USER_VIDEO_FETCH_PENDING:
            return {
                ...state,
                itemsBeingFetched: [].concat(action.payload, state.itemsBeingFetched),
            };

        case USER_VIDEO_FETCH_ALL_PENDING:
            return {
                ...state,
                hasFetchedAllForAccount: false,
                isFetchingAllForAccount: true,
            };

        case USER_VIDEO_FETCH_ALL_COMPLETE:
            return {
                ...state,
                hasFetchedAllForAccount: true,
                isFetchingAllForAccount: false,
                items: replaceOrAdd(state.items, action.payload, 'guid'),
            };

        case USER_VIDEO_FETCH_ALL_ERROR:
            return {
                ...state,
                error: action.payload.error,
                hasFetchedAllForAccount: false,
                isFetchingAllForAccount: false,
            };

        case USER_VIDEO_FETCH_ERROR:
            return {
                ...state,
                error: action.payload.error,
                itemsBeingFetched: removePropertyFromCollection(
                    state.itemsBeingFetched,
                    action.payload.guid,
                    'guid',
                ),
            };

        case USER_VIDEO_FETCH_COMPLETE:
            return {
                ...state,
                itemsBeingFetched: removePropertyFromCollection(
                    state.itemsBeingFetched,
                    action.payload,
                    'guid',
                ),
                items: replaceOrAdd(state.items, action.payload, 'guid'),
            };

        default:
            return state;
    }
};