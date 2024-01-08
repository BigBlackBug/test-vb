import * as selectors from 'app/state/selectors/index.js';
import {
    fetchOffers
} from 'shared/api/index.js';
import actions from './actions.js';

/**
 * Load the available offers for the active account (or the default offers
 * if there's no active accoint)
 * @param  {string || null} accountGUID   Current account guid or null
 */
const loadOffers = () => async (dispatch, getState) => {
    const storeState = getState();
    if (!selectors.shouldFetchAllOffers(storeState)) {
        return;
    }

    dispatch(actions.fetchingOffers());
    try {
        const accountGUID = selectors.getAccountGUID(storeState);

        const offers = await fetchOffers(accountGUID);
        dispatch(actions.receivedOffers(offers));
    } catch (error) {
        dispatch(actions.failedOffersFetch(error));
    }
};

export default {
    loadOffers,
};