import { UserVideoRendersQueryResult } from '../queries';
import { RenderedVideoFormat, RenderedVideo } from '../types';

/**
 * Convert raw graphql query data for a user video's renders into a formatted object
 * with render statuses/urls for each available format that the video was rendered in.
 *
 * @param {UserVideoRendersQueryResult} userVideoRendersQueryData
 */
export const getUserVideoRenderDataFromQueryData = (
  userVideoRendersQueryData?: UserVideoRendersQueryResult,
) => {
  const currentConfiguredVideo = userVideoRendersQueryData?.userVideoByGuid.currentConfiguredVideo;

  if (!currentConfiguredVideo) {
    return null;
  }

  const renderedVideos: {
    standardRender: RenderedVideo | null;
    broadcastRender: RenderedVideo | null;
    previewRender: RenderedVideo | null;
  } = { standardRender: null, broadcastRender: null, previewRender: null };

  currentConfiguredVideo.renderedVideos.edges.forEach(({ node }) => {
    const formattedRenderedVideo: RenderedVideo = {
      url: node.renderUrl,
      format: node.renderFormat,
      status: node.renderStatus,
      size: node.renderSize,
    };

    if (node.hasWatermark) {
      // If the rendered video has a watermark, it's a preview render
      renderedVideos.previewRender = formattedRenderedVideo;
    } else {
      switch (node.renderFormat) {
        case RenderedVideoFormat.email:
          renderedVideos.standardRender = formattedRenderedVideo;
          break;
        case RenderedVideoFormat.broadcastQuality:
          renderedVideos.broadcastRender = formattedRenderedVideo;
          break;
        default:
      }
    }
  });

  return renderedVideos;
};
