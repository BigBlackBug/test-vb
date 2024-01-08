// Local
import baseAPI from 'shared/api/core/base.js';
import {
    addQueryParametersToURL
} from 'shared/utils/urls.js';

import {
    VideoDescriptor
} from '@libs/shared-types';
import {
    UnformattedUserVideo
} from './types';

const SAVED_DRAFTS_URI = 'saved-drafts/';

/**
 * GET `/saved-drafts/?account_guid={accountGUID}`
 *
 * Fetch all current SavedDrafts for an account.
 */
export const fetchSavedDrafts = (accountGUID) => {
    const url = addQueryParametersToURL(SAVED_DRAFTS_URI, {
        account_guid: accountGUID
    });
    return baseAPI.get(url);
};

/**
 * POST `/saved-drafts/`
 *
 * Create a new SavedDraft and UserVideo record for an account.
 *
 * @param {Object} savedDraftPayload
 * @param {string} savedDraftPayload.account_guid
 * @param {Object} [savedDraftPayload.video_spec]
 * @param {string|null} savedDraftPayload.video_spec.variant_slug
 * @param {VideoDescriptor|null} savedDraftPayload.video_spec.configuration
 * @param  {string|null} [savedDraftPayload.business_guid]
 * @param  {string} [savedDraftPayload.title]
 * @param {string} [savedDraftPayload.stock_video_assets]
 * @param {string} [savedDraftPayload.voice_over_text]
 * @param {string|null} [savedDraftPayload.voice_over_speaker_guid]
 * @param {string} [savedDraftPayload.variant_group_slug]
 * @param {string|null} [savedDraftPayload.autofill_request_guid] - The request guid of the autofill request that generated this video, if applicable.
 *                                                              This allows us to update the UserVideoAutofillResult record with this video now that it has been saved.
 *
 * @returns {Promise<{
 *  saved_draft: Object;
 *  user_video: UnformattedUserVideo;
 * }>}
 * Requires:
 *  - `videoSpec`: The configuration + variant slug combo that will be
 *    used to create a new UserVideo for the newly created SavedDraft.
 */
export const createSavedDraft = (savedDraftPayload) =>
    baseAPI.post(SAVED_DRAFTS_URI, savedDraftPayload);

/**
 * POST `/saved-drafts/{savedDraftGUID}/remove`
 *
 * Updates the SavedDraft record to reflect that the user has "DELETED" the item.
 * Two things to note:
 *  - The record itself is not deleted, but the `removed_at` datetime is stamped out
 *  - This is *NOT* the endpoint to use if the user is moving the item from SavedDrafts
 *    to their Cart. See shared/api/shopState.js -- `createCartItem`.
 */
export const deleteSavedDraft = (savedDraftGUID) =>
    baseAPI.post(`${SAVED_DRAFTS_URI}${savedDraftGUID}/remove/`);