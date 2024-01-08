import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useUserVideoRenders } from 'app/models/userVideos/hooks';
import { RenderedVideoFormat } from 'app/models/userVideos/types';
import * as selectors from 'app/state/selectors/index.js';

import VideoRenderDownloadButton from '../VideoRenderDownloadButton';
import { VideoShareModalDownloadPreviewContainer } from './VideoShareModal.css';

/**
 * Displays all download options for a user video
 *
 * @param {string} userVideoGUID
 * @param {string} videoTitle
 */
export const RenderDownloadOptionList = ({
  userVideoGUID,
  videoTitle,
}: {
  userVideoGUID: string;
  videoTitle: string;
}) => {
  const { renderData } = useUserVideoRenders(userVideoGUID);

  const subscriptionAllowedVideoRenderQualities: RenderedVideoFormat[] = useSelector(
    selectors.subscriptionAllowedVideoRenderQualities,
  );

  const { hasStandardRenderPermissions, hasBroadcastRenderPermissions } = useMemo(() => {
    if (!subscriptionAllowedVideoRenderQualities) {
      // If we don't have subscriptionAllowedVideoRenderQualities, we default to
      // showing both standard and broadcast render options
      return {
        hasStandardRenderPermissions: true,
        hasBroadcastRenderPermissions: true,
      };
    }

    // If we do have subscriptionAllowedVideoRenderQualities, figure out
    // which ones the user has access to
    let hasStandardRender = false;
    let hasBroadcastRender = false;

    subscriptionAllowedVideoRenderQualities.forEach((renderQuality) => {
      if (renderQuality === RenderedVideoFormat.email) {
        hasStandardRender = true;
      } else if (renderQuality === RenderedVideoFormat.broadcastQuality) {
        hasBroadcastRender = true;
      }
    });

    return {
      hasStandardRenderPermissions: hasStandardRender,
      hasBroadcastRenderPermissions: hasBroadcastRender,
    };
  }, [subscriptionAllowedVideoRenderQualities]);

  return (
    <>
      <div className={VideoShareModalDownloadPreviewContainer}>
        {hasStandardRenderPermissions ? (
          <VideoRenderDownloadButton
            render={renderData?.standardRender}
            renderDescription="Digital quality (HD)"
            userVideoGUID={userVideoGUID}
            videoTitle={videoTitle}
            analyticsAction="download_digital_quality"
          />
        ) : null}
        {hasBroadcastRenderPermissions ? (
          <VideoRenderDownloadButton
            render={renderData?.broadcastRender}
            renderDescription="TV & streaming quality (HD)"
            userVideoGUID={userVideoGUID}
            videoTitle={videoTitle}
            analyticsAction="download_tv_quality"
          />
        ) : null}
      </div>
    </>
  );
};
