import {
    hasVoiceOverFeature
} from 'app/state/ducks/offers/selectors.js';
import {
    hasUserVideoBeenPurchased,
    getUserVideoLastEditableDate,
    getUserVideoVariantSlugByGUID,
} from 'app/state/ducks/userVideos/selectors.js';
import {
    getVariantBySlug
} from 'app/state/ducks/variants/selectors.js';

/**
 * Returns whether a given user video should be editable
 *
 * This is based on the "last editable date" set on the user video - unpurchased drafts allow
 * unlimited editing, but purchased videos will not be editable at all for non-subscribers and
 * will default to only being editable for 7 days after purchase for subscribers.
 * The last editable date on a video can be set through the admin to give users an extension if
 * needed.
 *
 * @param {object} state
 * @param {string} userVideoGUID    GUID of user video to check editability of
 */
export const isUserVideoEditingEnabled = (state, userVideoGUID) => {
    const userVideoLastEditableDate = getUserVideoLastEditableDate(state, userVideoGUID);

    // If the video doesn't have a last-editable date and therefore hasn't been purchased yet, it's always editable
    if (!userVideoLastEditableDate) return true;

    // A video should only be editable if its last editable date is is later than the current date
    return Date.now() < Date.parse(userVideoLastEditableDate);
};

/**
 * Returns whether the user can purchase a voice-over for a given user video
 *
 * This is only available for purchased videos owned by a user who has a subscription with
 * VO permissions
 *
 * @param {object} state
 * @param {string} userVideoGUID    GUID of user video to check VO availability for
 */
export const isVideoVoiceOverPurchaseAvailable = (state, userVideoGUID) =>
    // You can only get a VO for a purchased video
    hasUserVideoBeenPurchased(state, userVideoGUID) &&
    // Users can only purchase VO if their subscription has permissions for it
    hasVoiceOverFeature(state);

/**
 * Returns the variant object for a given user video
 *
 * @param {object} state
 * @param {string} userVideoGUID  GUID of user video to get variant for
 */
export const getVariantForUserVideo = (state, userVideoGUID) => {
    const variantSlug = getUserVideoVariantSlugByGUID(state, userVideoGUID);

    return getVariantBySlug(state, variantSlug);
};

/**
 * Returns the aspect ratio of a given user video's variant
 *
 * @param {object} state
 * @param {string} userVideoGUID  GUID of user video to get aspect ratio for
 */
export const getAspectRatioForUserVideo = (state, userVideoGUID) => {
    const variant = getVariantForUserVideo(state, userVideoGUID);

    return variant ? variant.width / variant.height : null;
};