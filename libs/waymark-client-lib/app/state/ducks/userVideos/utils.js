// Vendor
import moment from 'moment';

// Local
import {
    BASE_WHITE_LABELED_URL
} from 'app/constants/UserVideo.js';
import settings from 'shared/utils/settings.js';

const {
    APP_ENVIRONMENT
} = settings;

export const getUserVideoLastEditedAt = (userVideo) =>
    userVideo ? moment(userVideo.updated_at).fromNow() : '';

/**
 * Constructs a sharable branded preview url for the given user video in the format of
 * `waymark.com/preview/{userVideoGUID}`
 *
 * @param  {string} userVideoGUID
 */
export const getBrandedShareLinkForUserVideo = (userVideoGUID) => {
    const baseURL = window.location.origin;

    return `${baseURL}/preview/${userVideoGUID}`;
};

/**
 * Constructs a sharable white labeled/unbranded preview url for the given user video in the format of
 * `video-preview.com/{userVideoGUID}`
 *
 * @param {string} userVideoGUID
 */
export const getWhiteLabeledShareLinkForUserVideo = (userVideoGUID) => {
    const isLocal = APP_ENVIRONMENT === 'local';
    const isProd = APP_ENVIRONMENT === 'prod';

    const subdomain = !isLocal && !isProd ? `${APP_ENVIRONMENT}.` : '';
    const domain = isLocal ? 'localhost:8000' : BASE_WHITE_LABELED_URL;

    return `http${!isLocal ? 's' : ''}://${subdomain}${domain}/${userVideoGUID}`;
};