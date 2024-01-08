// Vendor
import _ from 'lodash';

// Local
import {
    globalizeSelector
} from 'app/utils/selectors.js';
import {
    stateKeys
} from 'app/constants/State.js';

const localSelectors = {};

/**
 * Get all saved draft objects loaded into the state.
 * @param  {Object} state
 */
localSelectors.getSavedDrafts = (state) => state.items;

/**
 * Get an array of user video guids for all saved drafts
 */
localSelectors.getSavedDraftUserVideoGUIDs = (state) =>
    state.items.map((savedDraft) => savedDraft.user_video);

/**
 * Get the saved draft object for a given user video
 * @param   {object} state
 * @param   {string} userVideoGUID
 */
localSelectors.getSavedDraftByUserVideoGUID = (state, userVideoGUID) =>
    _.find(state.items, {
        user_video: userVideoGUID,
    });

/**
 * Returns the number of saved drafts.
 *
 * @param      {Object}  state
 * @return     {Integer} number of saved drafts
 */
localSelectors.getSavedDraftCount = (state) => localSelectors.getSavedDrafts(state).length;

/**
 * Returns whether the SavedDrafts for the current ShopState are currently
 * being fetched from the server.
 * @param  {Object} state
 */
localSelectors.isFetchingAllSavedDrafts = (state) => state.isFetchingAll;

/**
 * Returns whether the SavedDrafts for the current ShopState have been
 * fetched from the server.
 * @param  {Object} state
 */
localSelectors.hasFetchedAllSavedDrafts = (state) => state.hasFetchedAll;

/**
 * Based on outstanding or already-completed requests, returns whether to fetch
 * the SavedDrafts from the server.
 * @param  {Object} state
 */
localSelectors.shouldFetchAllSavedDrafts = (state) =>
    !(
        localSelectors.isFetchingAllSavedDrafts(state) || localSelectors.hasFetchedAllSavedDrafts(state)
    );

export default localSelectors;

// Export global selectors.
const moduleName = 'savedDrafts';
const localPath = stateKeys[moduleName];

export const getSavedDrafts = globalizeSelector(localSelectors.getSavedDrafts, localPath);
export const getSavedDraftUserVideoGUIDs = globalizeSelector(
    localSelectors.getSavedDraftUserVideoGUIDs,
    localPath,
);
export const getSavedDraftByUserVideoGUID = globalizeSelector(
    localSelectors.getSavedDraftByUserVideoGUID,
    localPath,
);
export const getSavedDraftCount = globalizeSelector(localSelectors.getSavedDraftCount, localPath);
export const hasFetchedAllSavedDrafts = globalizeSelector(
    localSelectors.hasFetchedAllSavedDrafts,
    localPath,
);
export const isFetchingAllSavedDrafts = globalizeSelector(
    localSelectors.isFetchingAllSavedDrafts,
    localPath,
);
export const shouldFetchAllSavedDrafts = globalizeSelector(
    localSelectors.shouldFetchAllSavedDrafts,
    localPath,
);