// Local
import {
    replaceOrAdd
} from 'shared/utils/collections.js';
import {
    RECEIPT_FETCH_COMPLETE,
    RECEIPT_FETCH_ERROR,
    RECEIPT_FETCH_PENDING,
} from 'app/state/actionTypes.js';

// Reducer
const DEFAULT_STATE = {
    isFetchingFor: {},
    hasFetchedFor: {},
    error: '',
    items: [
        /*
        Serialized Receipt records.
          {
            guid: GUID,
            account: GUID,
            amount: 100,
            purchased_at: 'date string',
            receipt_offers: [
              {
                amount: 100,
                interval: 'monthly',
                offer: GUID,
                adjusted_amount: 75,
              }
            ],
          }
        */
    ],
};

export default (state = DEFAULT_STATE, action) => {
    const isFetchingFor = Object.assign({}, state.isFetchingFor);
    const hasFetchedFor = Object.assign({}, state.hasFetchedFor);
    const receiptGUID = action.payload ? action.payload.receiptGUID : null;

    switch (action.type) {
        case RECEIPT_FETCH_PENDING:
            isFetchingFor[receiptGUID] = true;
            hasFetchedFor[receiptGUID] = false;
            return {
                ...state,
                isFetchingFor,
                hasFetchedFor,
            };

        case RECEIPT_FETCH_ERROR:
            isFetchingFor[receiptGUID] = false;
            hasFetchedFor[receiptGUID] = false;
            return {
                ...state,
                isFetchingFor,
                hasFetchedFor,
                error: action.payload.error,
            };

        case RECEIPT_FETCH_COMPLETE:
            isFetchingFor[receiptGUID] = false;
            hasFetchedFor[receiptGUID] = true;

            return {
                ...state,
                isFetchingFor,
                hasFetchedFor,
                items: replaceOrAdd(state.items, action.payload.receipt, 'guid'),
            };

        default:
            return state;
    }
};