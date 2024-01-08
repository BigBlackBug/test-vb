// Local
import {
    PromiseCache
} from 'app/objects.js';
import * as selectors from 'app/state/selectors/index.js';
import {
    fetchAllUserVideos,
    fetchUserVideo,
    fetchUserVideosList,
    renderEditedPurchasedVideo,
    updateUserVideo,
    requestApprovalForUserVideo,
    submitUserVideoApproval,
} from 'shared/api/index.js';

import {
    getSanitizedVideoDescriptor
} from 'shared/web_video/utils/videoDescriptor';

import variantOperations from '../variants/operations.js';
import configuredVideoActions from '../configuredVideos/actions.js';
import configuredVideoOperations from '../configuredVideos/operations.js';
import userVideoActions from './actions.js';

// We cache the promises returned by the `fetchUserVideo` API call here, which
// we'll use to ensure that while a request for the same video guid (or guids) is already
// outstanding, we can return the appropriate promise for that user video request.
const pendingRequests = new PromiseCache();

/**
 * Ensures that the userVideo with the provided guid is loaded into
 * the state.
 * @param   {string}  guid  UserVideo guid.
 * @returns {Promise<UnformattedUserVideoWithVideoDescriptor>}
 */
const loadUserVideo =
    (guid, shouldForceFetch = false) =>
    async (dispatch, getState) => {
        const storeState = getState();
        const foundUserVideo = selectors.getUserVideoByGUID(storeState, guid);

        // If we already have the user video in our state, let's return it.
        if (foundUserVideo && !shouldForceFetch) {
            return foundUserVideo;
            // If we need to fetch this user video, let's get to it!
        }
        if (selectors.shouldFetchUserVideo(storeState, guid) || shouldForceFetch) {
            dispatch(userVideoActions.fetchingUserVideo(guid));

            try {
                const fetchingUserVideo = fetchUserVideo(guid);
                // Store the promise in the cache in case we need it later.
                pendingRequests.set(guid, fetchingUserVideo);

                /** @type {UnformattedUserVideoWithVideoDescriptor} */
                const userVideo = await fetchingUserVideo;
                userVideo.videoDescriptor = await getSanitizedVideoDescriptor(userVideo.video_spec);

                // The request completed, so let's null out the cache.
                pendingRequests.clear(guid);
                dispatch(userVideoActions.receivedUserVideo(userVideo));
                return userVideo;
            } catch (error) {
                // The request completed (failed), so let's null out the cache.
                pendingRequests.clear(guid);
                dispatch(userVideoActions.failedUserVideoFetch(error, guid));
                return error;
            }
            // If we don't have the user video loaded, but also don't need to fetch,
            // we should have a cached promise that will return when the user video
            // is received from the server.
        } else if (pendingRequests.get(guid)) {
            return pendingRequests.get(guid);
        } else {
            console.error(`Error loading user video with guid ${guid}.`);
            return null;
        }
    };

/**
 * Ensures that the userVideo as well as the underlying Variant
 * are loaded into the store state.
 * @param   {string}  guid  UserVideo guid.
 * @returns {Promise}
 */
const loadUserVideoWithVariant = (guid) => async (dispatch) => {
    const userVideo = await dispatch(loadUserVideo(guid));
    const variant = await dispatch(variantOperations.loadVariant(userVideo.video_template_variant));
    return {
        userVideo,
        variant
    };
};

/**
 * Ensure the UserVideos for the account provided have been loaded
 * into the store state. NOTE: Does not include loading of any
 * underlying or related resources (Variants).
 *
 * @param  {Array} account The Account object for the current user
 */
const loadUserVideosForAccount =
    (accountGUID, shouldForceFetch = false) =>
    async (dispatch, getState) => {
        if (!accountGUID) {
            return [];
        }

        const currentState = getState();

        if (!shouldForceFetch && selectors.hasFetchedAllUserVideosForAccount(currentState)) {
            return selectors.getAllUserVideos(currentState);
        }

        if (selectors.isFetchingAllUserVideosForAccount(currentState)) {
            return pendingRequests.get(accountGUID);
        }

        // If we need to fetch some user videos, let's get to it!
        dispatch(userVideoActions.fetchingAllUserVideos());
        try {
            const fetchingUserVideos = fetchAllUserVideos(accountGUID);

            // Store the promise in the cache in case we need it later.
            pendingRequests.set(accountGUID, fetchingUserVideos);

            const unformattedUserVideos = await fetchingUserVideos;

            // The request completed, so let's null out the cache.
            pendingRequests.clear(accountGUID);

            // Make sure each user video has a properly sanitized video descriptor
            // attached to it
            /** @type {UnformattedUserVideoWithVideoDescriptor[]} */
            const formattedUserVideos = await Promise.all(
                unformattedUserVideos.map(async (userVideo) => {
                    const videoDescriptor = await getSanitizedVideoDescriptor(userVideo.video_spec);

                    return {
                        ...userVideo,
                        videoDescriptor,
                    };
                }),
            );

            dispatch(userVideoActions.receivedAllUserVideos(formattedUserVideos));

            return formattedUserVideos;
        } catch (error) {
            // The request completed (failed), so let's null out the cache.
            pendingRequests.clear(accountGUID);
            dispatch(userVideoActions.failedAllUserVideosFetch(error));
            return [];
        }
    };

/**
 * For the account provided, fetch all UserVideos as well as any of the underlying
 * Variants that may be needed for display purposes.
 *
 * @param  {Array} guids UserVideo guids
 */
const loadUserVideosForAccountWithVariants = (accountGUID) => async (dispatch) => {
    const userVideos = await dispatch(loadUserVideosForAccount(accountGUID));

    // Get all the variant slugs that we need to be loaded (without duplicates).
    const variantSlugs = userVideos.map((userVideo) => userVideo.video_template_variant);

    // Load the variants we need.
    await dispatch(variantOperations.loadVariantsList(variantSlugs));
};

/**
 * Once a purchased UserVideo has been edited, kick off the API call to
 * create a new ConfiguredVideo and render it.
 * @param  {string}  userVideoGUID   User video guid.
 */
const renderPurchasedVideoEdit = (userVideoGUID, renderFormat) => async (dispatch) => {
    try {
        const {
            user_video: returnedUserVideo,
            configured_video: returnedConfiguredVideo
        } =
        await renderEditedPurchasedVideo(userVideoGUID, renderFormat);

        dispatch(userVideoActions.updateUserVideo(returnedUserVideo));
        dispatch(configuredVideoActions.receivedConfiguredVideo(returnedConfiguredVideo));

        return returnedUserVideo;
    } catch (error) {
        return error;
    }
};

/**
 * Sync user video edits and then pass the update to the state.
 *
 * @param {Object} config
 * @param {string} config.userVideoGUID  The GUID of the user video being updated
 * @param {CoreVideoDescriptor} config.videoDescriptor   The video descriptor describing the variant and configuration of the video
 * @param {string} config.variantSlug   The slug of the variant being applied to the video
 * @param {string|null} config.businessGUID   The GUID of the business being applied to the video for personalization (null if not applicable)
 * @param {string} config.videoTitle     The video's title
 * @param {Object} config.automatedVoiceOverConfig
 * @param {string|null} config.automatedVoiceOverConfig.speakerGUID The GUID of the automated VO speaker applied to the video
 * @param {string|null} config.automatedVoiceOverConfig.text The text of the automated VO applied to the video
 * @param {string[]} config.stockVideoAssetKeys  List of VPS keys for all stock video assets in the video's configuration so we can license them
 * @param {boolean} config.isFinalSaveBeforeClosing  Whether this is the last time the editor is being saved before the editor closes, meaning we can
 *                                              kick off renders for the video from the backend if needed
 *
 * @returns {Promise<UnformattedUserVideoWithVideoDescriptor>}
 */
const saveVideoEdits =
    ({
        userVideoGUID,
        videoDescriptor,
        variantSlug,
        businessGUID,
        videoTitle,
        automatedVoiceOverConfig,
        stockVideoAssetKeys,
        isFinalSaveBeforeClosing,
    }) =>
    async (dispatch) => {
        const returnedUserVideo = await updateUserVideo(userVideoGUID, {
            video_spec: {
                // TODO: we're doing this because it's the official way to update the variant_configuration field on
                // user videos via the old django API and we're just replacing old-style configurations
                // with new video descriptors.
                configuration: videoDescriptor,
                variant_slug: variantSlug,
            },
            business: businessGUID,
            title: videoTitle,
            voice_over_text: automatedVoiceOverConfig.text,
            voice_over_speaker_guid: automatedVoiceOverConfig.speakerGUID,
            stock_video_assets: stockVideoAssetKeys,
            is_final_save: isFinalSaveBeforeClosing,
        });

        /** @type {UnformattedUserVideoWithVideoDescriptor} */
        const userVideoWithVideoDescriptor = {
            ...returnedUserVideo,
            videoDescriptor,
        };

        dispatch(userVideoActions.updateUserVideo(userVideoWithVideoDescriptor));

        // If the returned video has a configured video on it, make sure we have that loaded
        if (userVideoWithVideoDescriptor.current_configured_video) {
            dispatch(
                configuredVideoOperations.loadConfiguredVideoByGUID(
                    userVideoWithVideoDescriptor.current_configured_video,
                ),
            );
        }

        return userVideoWithVideoDescriptor;
    };

/**
 * Creates an approval request for the given user video
 *
 * @param {string}  userVideoGUID   GUID for the user video to create a request for
 */
const requestUserVideoApproval = (userVideoGUID) => async (dispatch) => {
    try {
        const returnedUserVideo = await requestApprovalForUserVideo(userVideoGUID);
        dispatch(userVideoActions.updateUserVideo(returnedUserVideo));
        return returnedUserVideo;
    } catch (error) {
        return error;
    }
};

/**
 * Submits an approval for the current user video configuration that the user is
 * viewing
 *
 * @param {string} userVideoGUID      GUID for the user video to approve
 * @param {string} approverFullName   Name to record for the person submitting the approval
 */
const approveUserVideo = (userVideoGUID, approverFullName) => async (dispatch, getState) => {
    try {
        const userVideo = selectors.getUserVideoByGUID(getState(), userVideoGUID);
        // Get the video configuration which the user just watched and is approving
        const approvedConfiguration = userVideo.video_spec.configuration;

        const returnedUserVideo = await submitUserVideoApproval(
            userVideoGUID,
            approvedConfiguration,
            approverFullName,
        );
        dispatch(userVideoActions.updateUserVideo(returnedUserVideo));
        return returnedUserVideo;
    } catch (error) {
        return error;
    }
};

export default {
    loadUserVideo,
    loadUserVideoWithVariant,
    loadUserVideosForAccount,
    loadUserVideosForAccountWithVariants,
    renderPurchasedVideoEdit,
    saveVideoEdits,
    requestUserVideoApproval,
    approveUserVideo,
};