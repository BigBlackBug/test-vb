import { ChildFrameAPI, VideoData } from '@libs/waymark-sdk';

import { formatSDKUserVideoForSDK, getLoggedInAccount } from './utils';

import {
  getSDKUserVideoByGUID,
  getSDKUserVideosForAccount,
} from 'shared/api/graphql/userVideos/queries';

/**
 * Takes the getter callback for the SDK store and returns the video methods that should be passed to the FrameTranslator constructor
 */
export const getVideoMethods = (): Pick<ChildFrameAPI, 'getVideos' | 'getVideoData'> => ({
  getVideos: async () => {
    const account = getLoggedInAccount();
    if (!account) {
      return [];
    }
    const response = await getSDKUserVideosForAccount(account.guid);

    if (!response?.data?.accountByGuid?.userVideos?.edges?.length) {
      return [];
    }

    return response.data.accountByGuid.userVideos.edges.map(
      ({ node: userVideo }): VideoData => formatSDKUserVideoForSDK(userVideo),
    );
  },
  getVideoData: async (videoGUID) => {
    const response = await getSDKUserVideoByGUID(videoGUID);

    if (!response?.data?.userVideoByGuid) {
      return null;
    }

    return formatSDKUserVideoForSDK(response.data.userVideoByGuid);
  },
});
