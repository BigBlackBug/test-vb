// Vendor
import _ from 'lodash';

// Local
import {
    globalizeSelector
} from 'app/utils/selectors.js';
import {
    stateKeys
} from 'app/constants/State.js';
import {
    renderStatuses
} from 'app/constants/UserVideo.js';

const localSelectors = {};

/**
 * Get all ConfiguredVideo objects loaded into the state.
 * @param  {Object} state
 */
localSelectors.getConfiguredVideos = (state) => state.items;

/**
 * Attempt to get a ConfiguredVideo object by its GUID, assuming it exists and has been loaded
 * @param {Object} state
 * @param {string} configuredVideoGUID
 */
localSelectors.getConfiguredVideoByGUID = (state, configuredVideoGUID) =>
    _.find(state.items, {
        guid: configuredVideoGUID,
    }) || null;

/**
 * Get whether we have loaded all ConfiguredVideos for a given account
 * @param {Object} state
 * @param {string} accountGUID
 */
localSelectors.getAreConfiguredVideosLoadedForAccount = (state, accountGUID) =>
    state.loadedForAccountGUID === accountGUID;

/**
 * Get the array of RenderedVideos for a given configured video
 * @param {Object} state
 * @param {string} configuredVideoGUID  The GUID of the configured video to get renders for
 */
localSelectors.getConfiguredVideoRenders = (state, configuredVideoGUID) => {
    const configuredVideo = localSelectors.getConfiguredVideoByGUID(state, configuredVideoGUID);

    return _.get(configuredVideo, 'rendered_videos', []);
};

/**
 * Get the RenderedVideo for a given render format for a configured video.
 * @param {Object} state
 * @param {string} configuredVideoGUID  The GUID of the configured video to get the render from
 * @param {string} renderFormat The format of the render we want to get
 */
localSelectors.getConfiguredVideoRenderByFormat = (state, configuredVideoGUID, renderFormat) => {
    // Get the full list of rendered videos for the configured video
    const renderedVideos = localSelectors.getConfiguredVideoRenders(state, configuredVideoGUID);

    return (
        renderedVideos.find(
            (renderedVideo) =>
            // Exclude any renders with watermarks
            renderedVideo.render_format === renderFormat && !renderedVideo.watermark_slug,
        ) || null
    );
};

/**
 * Get the watermarked RenderedVideo for a configured video, if applicable.
 * @param {Object} state
 * @param {string} configuredVideoGUID
 */
localSelectors.getWatermarkedConfiguredVideoRender = (state, configuredVideoGUID) => {
    // Get the full list of rendered videos for the configured video
    const renderedVideos = localSelectors.getConfiguredVideoRenders(state, configuredVideoGUID);

    return renderedVideos.find((renderedVideo) => Boolean(renderedVideo.watermark_slug)) || null;
};

/**
 * Get whether a given configured video has at least one render in progress
 * @param {Object} state
 * @param {string} configuredVideoGUID  The GUID of the configured video
 */
localSelectors.getConfiguredVideoHasRenderInProgress = (state, configuredVideoGUID) => {
    // Get the full list of rendered videos for the configured video
    const renderedVideos = localSelectors.getConfiguredVideoRenders(state, configuredVideoGUID);

    // Return true if at least one render has an "in progress" status
    return _.some(renderedVideos, {
        render_status: renderStatuses.inProgress
    });
};

/**
 * Returns the rendered thumbnail image url for a configured video video, if it has one
 * @param {Object}  state
 * @param {string}  configuredVideoGUID
 */
localSelectors.getConfiguredVideoThumbnailURL = (state, configuredVideoGUID) => {
    const configuredVideo = localSelectors.getConfiguredVideoByGUID(state, configuredVideoGUID);

    return _.get(configuredVideo, 'thumbnail_url', null);
};

export default localSelectors;

// Export global selectors.
const moduleName = 'configuredVideos';
const localPath = stateKeys[moduleName];

export const getConfiguredVideos = globalizeSelector(localSelectors.getConfiguredVideos, localPath);
export const getConfiguredVideoByGUID = globalizeSelector(
    localSelectors.getConfiguredVideoByGUID,
    localPath,
);
export const getAreConfiguredVideosLoadedForAccount = globalizeSelector(
    localSelectors.getAreConfiguredVideosLoadedForAccount,
    localPath,
);
export const getConfiguredVideoRenders = globalizeSelector(
    localSelectors.getConfiguredVideoRenders,
    localPath,
);
export const getConfiguredVideoRenderByFormat = globalizeSelector(
    localSelectors.getConfiguredVideoRenderByFormat,
    localPath,
);
export const getWatermarkedConfiguredVideoRender = globalizeSelector(
    localSelectors.getWatermarkedConfiguredVideoRender,
    localPath,
);
export const getConfiguredVideoHasRenderInProgress = globalizeSelector(
    localSelectors.getConfiguredVideoHasRenderInProgress,
    localPath,
);
export const getConfiguredVideoThumbnailURL = globalizeSelector(
    localSelectors.getConfiguredVideoThumbnailURL,
    localPath,
);