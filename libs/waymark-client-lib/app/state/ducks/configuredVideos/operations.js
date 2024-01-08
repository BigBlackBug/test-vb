import {
    PromiseCache
} from 'app/objects.js';
import * as selectors from 'app/state/selectors/index.js';
import {
    fetchConfiguredVideosForAccount,
    fetchConfiguredVideosForUserVideos,
    fetchConfiguredVideo,
} from 'shared/api/index.js';
import actions from './actions.js';

// Cache the promises returned by API calls to fetch configured videos so we can avoid duplicate calls
const requestCache = new PromiseCache();

/**
 * Load all current ConfiguredVideo records for an account's UserVideos
 *
 * @param {string} accountGUID  The GUID of the account to get configured videos for
 * @param {boolean} shouldForceReload   Whether we should reload all configured videos for the account even if we have already loaded them previously
 */
const loadAllConfiguredVideosForAccount =
    (accountGUID, shouldForceReload = false) =>
    async (dispatch, getState) => {
        const storeState = getState();

        // If we have already loaded configured videos for the account and should not force a reload,
        // just return the currently loaded configured videos
        if (
            selectors.getAreConfiguredVideosLoadedForAccount(storeState, accountGUID) &&
            !shouldForceReload
        ) {
            return selectors.getConfiguredVideos(storeState);
        }

        const requestKey = `account-${accountGUID}`;

        // If we already have a cached pending promise for fetching the account's configured videos, return that
        const cachedRequestPromise = requestCache.get(requestKey);

        if (cachedRequestPromise) {
            return cachedRequestPromise;
        }

        const fetchPromise = fetchConfiguredVideosForAccount(accountGUID);

        requestCache.set(requestKey, fetchPromise);

        let returnValue;

        try {
            const configuredVideos = await fetchPromise;
            dispatch(actions.receivedAllConfiguredVideosForAccount(accountGUID, configuredVideos));
            returnValue = configuredVideos;
        } catch (error) {
            console.error(`Failed to fetch configured videos for account ${accountGUID}`, error);
            returnValue = [];
        }

        requestCache.clear(requestKey);
        return returnValue;
    };

/**
 * Load the current ConfiguredVideo record for a given UserVideo
 *
 * @param {string} userVideoGUID
 */
const loadConfiguredVideoForUserVideo = (userVideoGUID) => async (dispatch) => {
    const requestKey = `user-video-${userVideoGUID}`;

    // If we already have a cached pending promise for fetching the configured video, return that
    const cachedRequestPromise = requestCache.get(requestKey);

    if (cachedRequestPromise) {
        return cachedRequestPromise;
    }

    const fetchPromise = fetchConfiguredVideosForUserVideos([userVideoGUID]);

    requestCache.set(requestKey, fetchPromise);

    let returnValue;

    try {
        const [configuredVideo] = await fetchPromise;
        dispatch(actions.receivedConfiguredVideo(configuredVideo));
        returnValue = configuredVideo;
    } catch (error) {
        console.error(`Failed to fetch configured video for user video ${userVideoGUID}`, error);
        returnValue = error;
    }

    requestCache.clear(requestKey);
    return returnValue;
};

/**
 * Load a ConfiguredVideo record by GUID
 *
 * @param {string} configuredVideoGUID
 */
const loadConfiguredVideoByGUID =
    (configuredVideoGUID, shouldForceReload = false) =>
    async (dispatch, getState) => {
        const storeState = getState();

        // If we have already loaded this configured video and should not force a reload,
        // just return the one we have
        const loadedConfiguredVideo = selectors.getConfiguredVideoByGUID(
            storeState,
            configuredVideoGUID,
        );
        if (loadedConfiguredVideo && !shouldForceReload) {
            return loadedConfiguredVideo;
        }

        const requestKey = `configured-video-${configuredVideoGUID}`;

        // If we already have a cached pending promise for fetching the configured video, return that
        const cachedRequestPromise = requestCache.get(requestKey);

        if (cachedRequestPromise) {
            return cachedRequestPromise;
        }

        const fetchPromise = fetchConfiguredVideo(configuredVideoGUID);

        requestCache.set(requestKey, fetchPromise);

        let returnValue;

        try {
            const configuredVideo = await fetchPromise;
            dispatch(actions.receivedConfiguredVideo(configuredVideo));
            returnValue = configuredVideo;
        } catch (error) {
            console.error(`Failed to fetch configured video for guid ${configuredVideoGUID}`, error);
            returnValue = error;
        }

        requestCache.clear(requestKey);
        return returnValue;
    };

export default {
    loadAllConfiguredVideosForAccount,
    loadConfiguredVideoForUserVideo,
    loadConfiguredVideoByGUID,
};