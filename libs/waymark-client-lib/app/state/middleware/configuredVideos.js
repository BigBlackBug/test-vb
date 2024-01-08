import {
    SHOP_INITIALIZE_PENDING,
    ACCOUNT_FETCH_COMPLETE,
    ACCOUNT_LOGOUT,
} from 'app/state/actionTypes.js';

import {
    openRenderCompleteSubscriptionForAccount,
    cancelRenderCompleteSubscriptionForAccount,
} from 'app/state/ducks/configuredVideos/utils.js';
import configuredVideoActions from 'app/state/ducks/configuredVideos/actions.js';
import {
    apolloClient
} from 'shared/api/graphql';
import {
    userVideoRendersQuery
} from 'app/models/userVideos/queries';
import {
    fanoutVideoRenderCompletedEvent
} from 'app/utils/events';

/**
 * Middleware for managing hooking up a subscription to render completion events for the
 * current logged-in account
 */
const configuredVideosMiddleware = ({
    dispatch
}) => {
    let currentAccountGUID = null;

    const onRenderComplete = (configuredVideo) =>
        // The message payload for a render completion event is a ConfiguredVideo object, so update our list
        // with the newly received ConfiguredVideo
        {
            dispatch(configuredVideoActions.receivedConfiguredVideo(configuredVideo));

            // Emit global event notifying that a video render has completed
            fanoutVideoRenderCompletedEvent.emit(configuredVideo);

            // Invalidate any rendered video data in apollo's cache when a new render is completed
            apolloClient.refetchQueries({
                include: [{
                    query: userVideoRendersQuery,
                    variables: {
                        userVideoGUID: configuredVideo.user_video_guid
                    },
                }, ],
            });
        };

    /**
     * Manage our fanout subscription when the current account changes
     *
     * @param {string} newAccountGUID
     */
    const onAccountGuidChanged = (newAccountGUID) => {
        // If the account guid didn't change, return early
        if (currentAccountGUID === newAccountGUID) {
            return;
        }

        // If we have a previous account guid. cancel any existing subscription for that
        if (currentAccountGUID) {
            cancelRenderCompleteSubscriptionForAccount(currentAccountGUID, onRenderComplete);
        }

        // If we have a new account guid, open a new subscription for that
        if (newAccountGUID) {
            openRenderCompleteSubscriptionForAccount(newAccountGUID, onRenderComplete);
        }

        // Store the new account GUID
        currentAccountGUID = newAccountGUID;
    };

    return (next) => (action) => {
        switch (action.type) {
            case SHOP_INITIALIZE_PENDING:
                {
                    onAccountGuidChanged(action.payload.accountGUID);
                    break;
                }
            case ACCOUNT_FETCH_COMPLETE:
                {
                    onAccountGuidChanged(action.payload.guid);
                    break;
                }
            case ACCOUNT_LOGOUT:
                onAccountGuidChanged(null);
                break;

            default:
        }

        return next(action);
    };
};

export default configuredVideosMiddleware;