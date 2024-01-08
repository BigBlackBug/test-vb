// Vendor
import _ from 'lodash';

// Local
import {
    VideoSpec
} from 'app/objects.js';
import {
    globalizeSelector
} from 'app/utils/selectors.js';
import {
    stateKeys
} from 'app/constants/State.js';
import {
    videoApprovalStates
} from 'app/constants/VideoApproval';
import {
    VideoDescriptor
} from '@libs/shared-types';
import {
    UnformattedUserVideoWithVideoDescriptor
} from 'shared/api/types';

const localSelectors = {};

localSelectors.getAllUserVideos = (state) => state.items;

localSelectors.getUserVideoByGUID = (state, guid) => _.find(state.items, {
    guid
});

/**
 * Returns whether all user videos for an account have been fetched.
 * @param  {Object} state
 * @return {Boolean}
 */
localSelectors.hasFetchedAllUserVideosForAccount = (state) => state.hasFetchedAllForAccount;

/**
 * Returns whether all user videos are currently being fetched.
 * @param  {Object} state
 * @return {Boolean}
 */
localSelectors.isFetchingAllUserVideosForAccount = (state) => state.isFetchingAllForAccount;

/**
 * Returns whether or not the UserVideo with the provided guid is currently
 * being fetched from the server.
 * @param  {Object} state
 * @param  {String} guid
 * @returns {Boolean}
 */
localSelectors.isFetchingUserVideo = (state, guid) =>
    localSelectors.isFetchingAllUserVideosForAccount(state) ||
    _.includes(state.itemsBeingFetched, guid);

/**
 * Returns whether any user video is currently being fetched.
 * @param  {Object} state
 * @return {Boolean}
 */
localSelectors.isFetchingAnyUserVideo = (state) =>
    localSelectors.isFetchingAllUserVideosForAccount(state) || !!state.itemsBeingFetched.length;

/**
 * Returns a boolean for whether or not we should fetch the UserVideo with
 * the provided guid (if we already have the UserVideo loaded OR
 * we've already started fetching the UserVideo, return false).
 * @param  {Object} state
 * @param  {String} guid
 * @return {Boolean} False if we already have the UserVideo or are currently loading it, true otherwise.
 */
localSelectors.shouldFetchUserVideo = (state, guid) =>
    !(
        localSelectors.getUserVideoByGUID(state, guid) ||
        localSelectors.isFetchingUserVideo(state, guid)
    );

localSelectors.getUserVideosFromGUIDS = (state, guids) =>
    state.items.filter((userVideo) => _.includes(guids, userVideo.guid));

/**
 * From the list of provided UserVideo guids, determines which UserVideos
 * have not yet been fetched from the server and loaded into the store state.
 * @param  {Object} state             Current store state
 * @param  {Array} userVideoGUIDList  UserVideo guids
 */
localSelectors.excludeLoadedUserVideos = (state, userVideoGUIDList) =>
    userVideoGUIDList.filter(
        (guid) =>
        !localSelectors.getUserVideoByGUID(state, guid) ||
        localSelectors.isFetchingUserVideo(state, guid),
    );

/**
 * Gets the ConfiguredVideo GUID for a user video
 *
 * @param {Object} state
 * @param {string} userVideoGUID
 */
localSelectors.getUserVideoConfiguredVideoGUID = (state, userVideoGUID) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, userVideoGUID);

    return _.get(userVideo, 'current_configured_video', null);
};

/**
 * Gets the variant slug for a user video
 *
 * @param {object}  state
 * @param {string}  guid    GUID of the user video
 */
localSelectors.getUserVideoVariantSlugByGUID = (state, guid) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, guid);

    if (!userVideo) return null;

    return userVideo.video_spec.variant_slug;
};

localSelectors.getUserVideoVideoSpecByGUID = (state, guid) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, guid);

    if (!userVideo) return null;

    // In order to avoid reference errors, clone the configuration instead
    // of referencing the original video spec configuration.
    const configurationCopy = _.cloneDeep(userVideo.video_spec.configuration);

    return new VideoSpec({
        configuration: configurationCopy,
        variantSlug: userVideo.video_spec.variant_slug,
    });
};

/** @returns {null | VideoDescriptor} */
localSelectors.getUserVideoVideoDescriptorByGUID = (state, guid) => {
    /** @type {UnformattedUserVideoWithVideoDescriptor | null} */
    const userVideo = localSelectors.getUserVideoByGUID(state, guid);

    if (!userVideo) {
        return null;
    }

    return userVideo.videoDescriptor;
};

localSelectors.getUserVideoTitleByGUID = (state, guid) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, guid);

    if (!userVideo) return '';

    return userVideo.title;
};

/**
 * Returns if the userVideo Draft has been deleted
 * @param  {Object} state         Current store state
 * @param  {string} guid          UserVideo guid
 */
localSelectors.hasUserVideoBeenDeleted = (state, guid) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, guid);

    if (!userVideo) return null;

    return userVideo.has_been_deleted_by_user;
};

/**
 * Returns if the user video has been purchased
 * @param {object}  state
 * @param {string}  guid      User video guid
 */
localSelectors.hasUserVideoBeenPurchased = (state, guid) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, guid);
    return userVideo && Boolean(userVideo.purchased_product_object_id);
};

/**
 * Returns the latest date that the given user video will be editable, or null if it hasn't been purchased
 * @param {object}  state
 * @param {string}  guid      User video guid
 */
localSelectors.getUserVideoLastEditableDate = (state, guid) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, guid);
    return userVideo && userVideo.last_editable_date;
};

/**
 * Returns whether the user video that was most recently modified is
 * a purchased video or not - useful so we can collapse the saved drafts
 * list section if the most relevant video for the user will be a purchased video
 */
localSelectors.hasLatestUserVideoBeenPurchased = (state) => {
    const mostRecentUserVideo = _.maxBy(state.items, (userVideo) =>
        new Date(userVideo.last_edited_by_user || 0).getTime(),
    );

    return Boolean(mostRecentUserVideo && mostRecentUserVideo.purchased_product_object_id);
};

/**
 * For the provided UserVideo GUID, returns the GUID for the related business.
 * @param  {Object} state
 * @param  {string} userVideoGUID
 */
localSelectors.getUserVideoBusinessGUID = (state, userVideoGUID) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, userVideoGUID);
    return userVideo ? userVideo.business : null;
};

/**
 * Returns current approval status of user video. Possible values are enumerated in the videoApprovalStates object
 * defined in the shared/utils/constants.js file
 *
 * @param {object}  state
 * @param {string}  userVideoGUID
 */
localSelectors.getUserVideoApprovalStatus = (state, userVideoGUID) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, userVideoGUID);

    if (!userVideo) return null;

    const videoApprovals = userVideo.video_approvals;

    if (!_.isEmpty(videoApprovals)) {
        const currentVideoApproval = videoApprovals[0];

        if (currentVideoApproval.approved_at) return videoApprovalStates.approved;

        return videoApprovals.length > 1 ? // If there is more than 1 approval record, this means the video was previously
            // approved but has been changed again since then
            videoApprovalStates.hasUnapprovedChanges :
            videoApprovalStates.pending;
    }

    return null;
};

/**
 * Returns info about for the video's most recently completed approval
 *
 * @param {object}  state
 * @param {string}  userVideoGUID
 *
 * @return {object} Object with the approval date and full name of the person who approved the video
 */
localSelectors.getUserVideoLastApprovalInfo = (state, userVideoGUID) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, userVideoGUID);

    if (!userVideo) return null;

    const videoApprovals = userVideo.video_approvals;

    if (!_.isEmpty(videoApprovals)) {
        // Return info for the the most recent time that the video was approved, if it's been
        // approved before
        return _.find(videoApprovals, (approval) => Boolean(approval.approved_at)) || null;
    }

    return null;
};

/**
 * Returns the GUID of the account that owns a given user video
 *
 * @param {object}  state
 * @param {string}  userVideoGUID
 *
 * @return {string} The GUID of the account that owns the video
 */
localSelectors.getUserVideoOwnerAccountGUID = (state, userVideoGUID) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, userVideoGUID);

    return userVideo ? userVideo.account : null;
};

/**
 * Returns a user video's voice-over product if voice-over has been added
 *
 * @param {object} state
 * @param {string} userVideoGUID
 */
localSelectors.getUserVideoVoiceOverProduct = (state, userVideoGUID) => {
    const userVideo = localSelectors.getUserVideoByGUID(state, userVideoGUID);

    const voiceOverProduct = userVideo ? .voice_over_product;
    if (!voiceOverProduct) return null;

    // Note: voice overs purchased after mid-Q2 2022 will be rendered on the standard and
    // high-quality renders, but we still need the URL legacy purchases on the VideoPreviewPage
    // and to determine whether or not a video has purchased voice-over.
    const deprecatedRenderURL = voiceOverProduct.deprecated_render_url;

    return {
        deprecatedRenderURL,
        isDelivered: voiceOverProduct.is_delivered || Boolean(deprecatedRenderURL),
    };
};

export default localSelectors;

// Export global selectors.
const moduleName = 'userVideos';
const localPath = stateKeys[moduleName];

export const excludeLoadedUserVideos = globalizeSelector(
    localSelectors.excludeLoadedUserVideos,
    localPath,
);
export const getUserVideoBusinessGUID = globalizeSelector(
    localSelectors.getUserVideoBusinessGUID,
    localPath,
);
export const getAllUserVideos = globalizeSelector(localSelectors.getAllUserVideos, localPath);
export const getUserVideoByGUID = globalizeSelector(localSelectors.getUserVideoByGUID, localPath);
export const getUserVideosFromGUIDS = globalizeSelector(
    localSelectors.getUserVideosFromGUIDS,
    localPath,
);
export const getUserVideoConfiguredVideoGUID = globalizeSelector(
    localSelectors.getUserVideoConfiguredVideoGUID,
    localPath,
);
export const getUserVideoVariantSlugByGUID = globalizeSelector(
    localSelectors.getUserVideoVariantSlugByGUID,
    localPath,
);
export const getUserVideoVideoSpecByGUID = globalizeSelector(
    localSelectors.getUserVideoVideoSpecByGUID,
    localPath,
);
export const getUserVideoVideoDescriptorByGUID = globalizeSelector(
    localSelectors.getUserVideoVideoDescriptorByGUID,
    localPath,
);
export const getUserVideoTitleByGUID = globalizeSelector(
    localSelectors.getUserVideoTitleByGUID,
    localPath,
);
export const isFetchingAllUserVideosForAccount = globalizeSelector(
    localSelectors.isFetchingAllUserVideosForAccount,
    localPath,
);
export const hasFetchedAllUserVideosForAccount = globalizeSelector(
    localSelectors.hasFetchedAllUserVideosForAccount,
    localPath,
);
export const isFetchingUserVideo = globalizeSelector(localSelectors.isFetchingUserVideo, localPath);
export const isFetchingAnyUserVideo = globalizeSelector(
    localSelectors.isFetchingAnyUserVideo,
    localPath,
);
export const shouldFetchUserVideo = globalizeSelector(
    localSelectors.shouldFetchUserVideo,
    localPath,
);
export const hasUserVideoBeenDeleted = globalizeSelector(
    localSelectors.hasUserVideoBeenDeleted,
    localPath,
);
export const hasUserVideoBeenPurchased = globalizeSelector(
    localSelectors.hasUserVideoBeenPurchased,
    localPath,
);
export const getUserVideoLastEditableDate = globalizeSelector(
    localSelectors.getUserVideoLastEditableDate,
    localPath,
);
export const hasLatestUserVideoBeenPurchased = globalizeSelector(
    localSelectors.hasLatestUserVideoBeenPurchased,
    localPath,
);
export const getUserVideoApprovalStatus = globalizeSelector(
    localSelectors.getUserVideoApprovalStatus,
    localPath,
);
export const getUserVideoLastApprovalInfo = globalizeSelector(
    localSelectors.getUserVideoLastApprovalInfo,
    localPath,
);
export const getUserVideoOwnerAccountGUID = globalizeSelector(
    localSelectors.getUserVideoOwnerAccountGUID,
    localPath,
);
export const getUserVideoVoiceOverProduct = globalizeSelector(
    localSelectors.getUserVideoVoiceOverProduct,
    localPath,
);