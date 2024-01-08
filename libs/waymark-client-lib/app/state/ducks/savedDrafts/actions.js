import {
    SAVED_DRAFTS_ADD,
    SAVED_DRAFTS_FETCH_COMPLETE,
    SAVED_DRAFTS_FETCH_ERROR,
    SAVED_DRAFTS_FETCH_PENDING,
    SAVED_DRAFTS_REMOVE,
} from 'app/state/actionTypes.js';

// Action Creations

/**
 * Adds one or many saved drafts
 * @param  {Object || Array} savedDrafts
 */
const addToSavedDrafts = (savedDrafts) => ({
    type: SAVED_DRAFTS_ADD,
    payload: savedDrafts,
});

const removeFromSavedDrafts = (savedDraft) => ({
    type: SAVED_DRAFTS_REMOVE,
    payload: savedDraft,
});

const fetchingSavedDrafts = () => ({
    type: SAVED_DRAFTS_FETCH_PENDING,
});

const receivedSavedDrafts = (savedDrafts) => ({
    type: SAVED_DRAFTS_FETCH_COMPLETE,
    payload: savedDrafts,
});

const failedSavedDraftsFetch = (error) => ({
    type: SAVED_DRAFTS_FETCH_ERROR,
    payload: error,
});

export default {
    addToSavedDrafts,
    failedSavedDraftsFetch,
    fetchingSavedDrafts,
    receivedSavedDrafts,
    removeFromSavedDrafts,
};