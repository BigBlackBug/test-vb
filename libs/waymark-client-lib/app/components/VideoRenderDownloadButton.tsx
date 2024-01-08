// Vendor
import { useState } from 'react';
import fileSize from 'filesize';

// Shared UI
import { DotLoader } from '@libs/shared-ui-components';

// Local
import { WaymarkButton, WaymarkButtonProps } from 'shared/components/WaymarkButton';
import { ExternalLink } from 'shared/components/WaymarkLinks';
import { DownloadIcon } from 'app/icons/PresenceAndSharingIcons';

import { RenderedVideo, RenderedVideoStatus } from 'app/models/userVideos/types';
import { renderUserVideo } from 'app/models/userVideos/mutations';
import {
  baseDownloadIconStyle,
  baseRenderButtonStyle,
  baseRenderDescriptionStyle,
  dataIsRenderInProgress,
  incompleteRenderDescription,
  renderDotLoader,
} from './VideoRenderDownloadButton.css';

interface VideoRenderDownloadButtonProps {
  render?: RenderedVideo | null;
  renderDescription?: string | null;
  userVideoGUID: string;
  videoTitle: string;
  buttonText?: string | null;
  colorTheme?: WaymarkButtonProps['colorTheme'];
  analyticsAction?: string | null;
}

/**
 * Button displays a loading state for an in-progress render or allows users to download a completed render.
 * If the render has not been started or failed, it will provide a button to allow the user to attempt to kick
 * off a re-render.
 *
 * @param {object}  render    The serialized RenderedVideo record that we want to download/show the status of
 * @param {string}  renderDescription   Text to display next to the button to describe the render
 * @param {string}  userVideoGUID   GUID of the user video that this render belongs to
 * @param {string} colorTheme   The buttonTheme value to apply to the button
 * @param {string} buttonText   Optional property of text to show instead of download icon and file size
 * @param {string} analyticsAction   Optional property of google analytics action to send when the button is clicked
 */
const VideoRenderDownloadButton = ({
  render = null,
  renderDescription = null,
  userVideoGUID,
  videoTitle,
  buttonText = null,
  colorTheme = 'Secondary',
  analyticsAction = null,
}: VideoRenderDownloadButtonProps) => {
  const [isRenderRequestInProgress, setIsRenderRequestInProgress] = useState(false);

  const {
    url: renderURL,
    format: renderFormat,
    size: renderSize,
    status: renderStatus,
  } = render || {};

  if (renderURL) {
    // If we have a download url for the render, show a download button to download the video
    return (
      <>
        {renderDescription ? (
          <p className={baseRenderDescriptionStyle}>{renderDescription}</p>
        ) : null}
        <ExternalLink
          linkTo={renderURL}
          download={videoTitle}
          colorTheme={colorTheme}
          hasFill
          className={baseRenderButtonStyle}
          analyticsAction={analyticsAction}
        >
          {buttonText || (
            <>
              <DownloadIcon color="currentColor" className={baseDownloadIconStyle} />
              {/* Parse the number of bytes in the download file into a readable string, rounded down to the nearest whole number */}
              {fileSize(renderSize || 0, { round: 0 })}
            </>
          )}
        </ExternalLink>
      </>
    );
  }

  // Whether we should show a loading state because the render is being requested or is in progress
  const isRenderInProgress =
    isRenderRequestInProgress ||
    renderStatus === RenderedVideoStatus.initial ||
    renderStatus === RenderedVideoStatus.inProgress;

  // Kick off a render for this user video
  const onClickRenderVideo = async () => {
    // Don't request another render if it's already in progress
    if (isRenderInProgress) {
      return;
    }

    try {
      setIsRenderRequestInProgress(true);
      await renderUserVideo(userVideoGUID, renderFormat);
    } catch (e) {
      console.error('An error occurred while attempting to render video', e);
    } finally {
      setIsRenderRequestInProgress(false);
    }
  };

  // Either show a button to kick off a render if a render isn't in progress, or a disabled
  // button with a dot loader if a render is already in progress
  return (
    <>
      <p className={incompleteRenderDescription} {...dataIsRenderInProgress(isRenderInProgress)}>
        {renderDescription}
      </p>
      <WaymarkButton
        onClick={onClickRenderVideo}
        colorTheme={colorTheme}
        // Disable clicking the render button again while our request is in progress
        isDisabled={isRenderInProgress}
        className={baseRenderButtonStyle}
      >
        {isRenderInProgress ? (
          <>
            <DownloadIcon className={baseDownloadIconStyle} />
            <DotLoader className={renderDotLoader} />
          </>
        ) : (
          'Render'
        )}
      </WaymarkButton>
    </>
  );
};

export default VideoRenderDownloadButton;
