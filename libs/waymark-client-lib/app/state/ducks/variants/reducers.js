// Vendor
import _ from 'lodash';

// Local
import {
    replaceOrAdd,
    removePropertyFromCollection
} from 'shared/utils/collections.js';
import {
    VARIANT_FETCH_PENDING,
    VARIANT_FETCH_COMPLETE,
    VARIANT_FETCH_ERROR,
} from '../../actionTypes.js';

// Reducers
const DEFAULT_STATE = {
    itemsBeingFetched: [],
    items: [],
    error: '',
};

export default (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case VARIANT_FETCH_PENDING:
            return {
                ...state,
                itemsBeingFetched: state.itemsBeingFetched.concat(action.payload),
            };

        case VARIANT_FETCH_ERROR:
            return {
                ...state,
                error: action.payload.error,
                itemsBeingFetched: _.without(state.itemsBeingFetched, action.payload.slugOrGUID),
            };

        case VARIANT_FETCH_COMPLETE:
            return {
                ...state,
                itemsBeingFetched: removePropertyFromCollection(state.itemsBeingFetched, action.payload, [
                    'slug',
                    'guid',
                ]),
                items: replaceOrAdd(state.items, action.payload, 'slug'),
            };

        default:
            return state;
    }
};