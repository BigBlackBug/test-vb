// Local
import baseAPI from 'shared/api/core/base.js';
import {
    UnformattedUserVideo
} from './types';

/**
 * GET `/user-videos/{userVideoGUID}`
 *
 * Fetch a single UserVideo record.
 *
 * @returns {Promise<UnformattedUserVideo>}
 */
export const fetchUserVideo = (userVideoGUID) => baseAPI.get(`user-videos/${userVideoGUID}/`);

/**
 * PATCH `/user-videos/{userVideoGUID}/`
 *
 * Update a single user video record.
 */
export const updateUserVideo = (userVideoGUID, payload) => {
    const url = `user-videos/${userVideoGUID}/`;
    return baseAPI.patch(url, payload);
};

/**
 * GET `/user-videos/`
 *
 * Fetch a list of UserVideos. Request requires a comma-delimited set of UserVideo
 * guid values passed via the `guids` query param.
 */
export const fetchUserVideosList = (userVideoGUIDList) => {
    const guidQueryString = userVideoGUIDList.join(',');
    return baseAPI.get(`user-videos/?guids=${guidQueryString}`);
};

/**
 * GET `/user-videos/`
 *
 * Fetch a list of all UserVideos for an account.
 */
export const fetchAllUserVideos = (accountGUID) =>
    baseAPI.get(`user-videos/?account_guid=${accountGUID}`);

export const renderEditedPurchasedVideo = (userVideoGUID, renderFormat) => {
    const payload = {
        render_format: renderFormat,
    };

    return baseAPI.post(`user-videos/${userVideoGUID}/render/`, payload);
};

/**
 * GET `/user-videos/{userVideoGUID}/video-download-product/`
 *
 * Fetches purchased video info for a given user video
 */
export const fetchVideoDownloadProductForUserVideo = (userVideoGUID) => {
    const url = `user-videos/${userVideoGUID}/video-download-product/`;

    return baseAPI.get(url);
};

/**
 * POST `/user-videos/{userVideoGUID}/request-approval/`
 *
 * Makes an approval request for a user video
 */
export const requestApprovalForUserVideo = (userVideoGUID) => {
    const url = `user-videos/${userVideoGUID}/request-approval/`;

    return baseAPI.post(url);
};

/**
 * POST `/user-videos/{userVideoGUID}/approve/`
 *
 * @param {string}  userVideoGUID         The GUID for the user video being approved
 * @param {object}  approvedConfiguration The video configuration being approved
 * @param {string}  approverFullName      The name of the person submitting their approval
 */
export const submitUserVideoApproval = (userVideoGUID, approvedConfiguration, approverFullName) => {
    const url = `user-videos/${userVideoGUID}/approve/`;

    const payload = {
        approved_configuration: approvedConfiguration,
        full_name: approverFullName,
    };

    return baseAPI.post(url, payload);
};