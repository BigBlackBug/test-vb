// Local
import {
    CONFIGURED_VIDEOS_RECEIVED_ALL_FOR_ACCOUNT,
    CONFIGURED_VIDEOS_RECEIVED_VIDEO,
} from '../../actionTypes.js';

/**
 * Successfully fetched all configured videos for an account
 */
const receivedAllConfiguredVideosForAccount = (accountGUID, configuredVideos) => ({
    type: CONFIGURED_VIDEOS_RECEIVED_ALL_FOR_ACCOUNT,
    payload: {
        accountGUID,
        configuredVideos,
    },
});

/**
 * Received a single ConfiguredVideo from an individual fetch or a render complete event
 */
const receivedConfiguredVideo = (configuredVideo) => ({
    type: CONFIGURED_VIDEOS_RECEIVED_VIDEO,
    payload: configuredVideo,
});

export default {
    receivedAllConfiguredVideosForAccount,
    receivedConfiguredVideo,
};