// Local
import baseAPI from 'shared/api/core/base.js';

/**
 * GET `configured-videos/?account_guid={ACCOUNT_GUID}`
 *
 * Fetch all configured videos for the active account
 *
 * @param  {String} accountGUID  Selected account guid.
 */
export const fetchConfiguredVideosForAccount = (accountGUID) => {
    const url = `configured-videos/?account_guid=${accountGUID}`;

    return baseAPI.get(url);
};

/**
 * GET `configured-videos/?user_video_guids={COMMA_SEPARATED_USER_VIDEO_GUIDS}`
 *
 * Fetches the current configured videos for a list of user video guids
 *
 * @param {string[]} userVideoGUIDs
 */
export const fetchConfiguredVideosForUserVideos = (userVideoGUIDs) => {
    const url = `configured-videos/?user_video_guids=${userVideoGUIDs.join(',')}`;

    return baseAPI.get(url);
};

/**
 * GET `configured-videos/{CONFIGURED_VIDEO_GUID}`
 *
 * Fetch a configured video by GUID
 *
 * @param {string}  configuredVideoGUID
 */
export const fetchConfiguredVideo = (configuredVideoGUID) => {
    const url = `configured-videos/${configuredVideoGUID}/`;

    return baseAPI.get(url);
};