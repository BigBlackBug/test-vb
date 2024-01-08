import accountMiddleware from './account.js';
import configuredVideosMiddleware from './configuredVideos.js';
import offersMiddleware from './offers.js';
import trackingInfoMiddleware from './trackingInfo.js';
import userVideosMiddleware from './userVideos.js';

// Export as a spreadable array
export default [
    accountMiddleware,
    configuredVideosMiddleware,
    offersMiddleware,
    trackingInfoMiddleware,
    userVideosMiddleware,
];