// Local
import {
    PromiseCache
} from 'app/objects.js';
import * as selectors from 'app/state/selectors/index.js';
import {
    deleteSavedDraft,
    fetchSavedDrafts
} from 'shared/api/index.js';
import actions from './actions.js';

// Operations

const removeSavedDraft = (savedDraft) => async (dispatch) => {
    try {
        await deleteSavedDraft(savedDraft.guid);
        dispatch(actions.removeFromSavedDrafts(savedDraft));
    } catch (error) {
        console.error('Unable to delete draft: ', error);
    }
};

/**
 * Removes a saved draft given the guid for its user video
 *
 * @param {string} userVideoGUID
 */
const removeSavedDraftByUserVideoGUID = (userVideoGUID) => (dispatch, getState) => {
    const savedDraft = selectors.getSavedDraftByUserVideoGUID(getState(), userVideoGUID);

    if (savedDraft) {
        dispatch(removeSavedDraft(savedDraft));
    }
};

// We cache the promises returned by the `fetchSavedDrafts` API call here, which
// we'll use to ensure that any call to the `loadSavedDrafts` operation that occurs
// while a request is already outstanding can be returned the appropriate promise.
const pendingRequests = new PromiseCache();

/**
 * Load the SavedDrafts records into the store. NOTE: Does not include loading of any
 * underlying or related resources (UserVideos).
 * @param  {String} shopStateGUID
 */
const loadSavedDrafts = (accountGUID) => async (dispatch, getState) => {
    const storeState = getState();
    const loadedDrafts = selectors.getSavedDrafts(storeState);
    const shouldFetchDrafts = selectors.shouldFetchAllSavedDrafts(storeState);

    // If, we've already fetched and we already have drafts in our state, let's return them.
    if (!shouldFetchDrafts) {
        // Checking if we're waiting for this to complete.
        if (pendingRequests.get(accountGUID)) {
            return pendingRequests.get(accountGUID);
        }

        // Otherwise, we'll return whatever we've got loaded.
        return loadedDrafts;
    }

    // Else, we need to fetch the drafts, let's get to it!
    dispatch(actions.fetchingSavedDrafts());

    try {
        const fetchingSavedDrafts = fetchSavedDrafts(accountGUID);
        // Store the promise in the cache in case we need it later.
        pendingRequests.set(accountGUID, fetchingSavedDrafts);
        const savedDrafts = await fetchingSavedDrafts;

        // The request completed, so let's null out the cache.
        pendingRequests.clear(accountGUID);
        dispatch(actions.receivedSavedDrafts(savedDrafts));
        return savedDrafts;
    } catch (error) {
        console.error(error);
        // The request completed (failed), so let's null out the cache.
        pendingRequests.clear(accountGUID);
        dispatch(actions.failedSavedDraftsFetch(error));
        return error;
    }
};

export default {
    loadSavedDrafts,
    removeSavedDraft,
    removeSavedDraftByUserVideoGUID,
};