import {
    USER_VIDEO_ADD,
    USER_VIDEO_UPDATE
} from 'app/state/actionTypes.js';
import {
    apolloClient
} from 'shared/api/graphql';

import {
    accountPageUserVideosQueryName,
    lastEditedUserVideoInfoQueryName,
} from 'app/models/userVideos/queries';

/**
 * Middleware for managing hooking up a subscription to render completion events for the
 * current logged-in account
 */
const userVideosMiddleware = () => (next) => (action) => {
    switch (action.type) {
        case USER_VIDEO_ADD:
            {
                // If a new video is created via a redux action, make sure to invalidate
                // any cached user video queries
                apolloClient.refetchQueries({
                    include: [accountPageUserVideosQueryName, lastEditedUserVideoInfoQueryName],
                });
                break;
            }
        case USER_VIDEO_UPDATE:
            {
                const userVideoGUID = action.payload.guid;

                // If a video is updated via a redux action (ie, the video's title was changed in the editor),
                // invalidate the cache entry for that video (this will cause any queries with this video
                // to be refetched next time they are accessed)
                apolloClient.refetchQueries({
                    updateCache(cache) {
                        cache.modify({
                            id: cache.identify({
                                __typename: 'UserVideoNode',
                                guid: userVideoGUID,
                            }),
                            fields: (currentFieldValue, {
                                INVALIDATE
                            }) => INVALIDATE,
                        });
                    },
                });
                break;
            }

        default:
    }

    return next(action);
};

export default userVideosMiddleware;