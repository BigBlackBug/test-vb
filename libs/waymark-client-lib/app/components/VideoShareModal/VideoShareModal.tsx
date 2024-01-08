// Vendor
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

// Local
import { InfoBox, ModalFooterSection, ModalHeaderSection } from '@libs/shared-ui-components/src';
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';
import UserVideoShareLinkInput from 'app/components/UserVideoShareLinkInput';
import VideoRenderDownloadButton from 'app/components/VideoRenderDownloadButton';
import * as selectors from 'app/state/selectors/index.js';
import { useUserVideoRenders } from 'app/models/userVideos/hooks';
import { getBrandedShareLinkForUserVideo } from 'app/state/ducks/userVideos/utils';
import CrossFadeTransition from 'shared/components/CrossFadeTransition.js';
import withWaymarkModal from 'shared/components/WithWaymarkModal';
import { InternalLink } from 'shared/components/WaymarkLinks';
import { appURLs } from 'app/constants/urls';
import { useIsSDKSession } from 'app/providers/SDKSessionProvider';
import { RenderedVideoStatus } from 'app/models/userVideos/types';
import { RenderDownloadOptionList } from './RenderOptionDownloadList';
import { useUserInfoForRender } from './hooks';
import { VideoShareModalFooter } from './VideoShareModalFooter';

// Styles
import * as styles from './VideoShareModal.css';

interface VideoShareModalContentsProps {
  userVideo: { guid: string; title: string };
  hideRenderDownload?: boolean;
}

export enum CannotRenderReason {
  NoCredits = 'NoCredits',
  NoLogin = 'NoLogin',
  NotSubscribed = 'NotSubscribed',
  Error = 'Error',
}

/**
 * Contents for the main video share menu
 *
 * @param {string}  userVideo   The user video to be used for any actions taken in the modal
 * @param {string}  hideRenderDownload     If the download preview should be hidden
 */
export const VideoShareModalContents = ({
  userVideo,
  hideRenderDownload = false,
}: VideoShareModalContentsProps) => {
  // Regular users should only see the regular Waymark sharing link
  // Users associated with whitelabeled partners, i.e. the entire site is whitelabeled, should only see the whitelabeled preview link
  // Users that have whitelabeled previews (but are not associated with fully-whitelabeled sites) should see both
  const userHasPreviewWhitelabeling = useSelector(
    selectors.getBrandingProfileHasPreviewWhiteLabeling,
  );
  const isSiteWhitelabeled = useSelector(selectors.getBrandingProfileIsSiteWhitelabeled);
  const isSDKSession = useIsSDKSession();

  const shouldWhiteLabel = userHasPreviewWhitelabeling || isSiteWhitelabeled || isSDKSession;

  // Render info ---------------------------------------------------------------
  const { renderData, refetch: refetchRenderData } = useUserVideoRenders(userVideo.guid);
  const watermarkedPreviewRender = renderData?.previewRender;

  const hasRenderInProgress = useMemo(
    () =>
      renderData?.broadcastRender?.status === RenderedVideoStatus.inProgress ||
      renderData?.standardRender?.status === RenderedVideoStatus.inProgress,
    [renderData],
  );

  const hasCompletedRender = useMemo(
    () =>
      renderData?.broadcastRender?.status === RenderedVideoStatus.succeeded ||
      renderData?.standardRender?.status === RenderedVideoStatus.succeeded,
    [renderData],
  );

  // If we don't have renderData, refetch it.
  useEffect(() => {
    if (renderData == null) {
      refetchRenderData();
    }
  }, [renderData, refetchRenderData]);

  const [isRenderProgressInfoDismissed, setIsRenderProgressInfoDismissed] = useState(false);
  const [cannotRenderReason, setCannotRenderReason] = useState<CannotRenderReason | null>(null);

  // Admin share link ----------------------------------------------------------
  const shareLinkURL = useMemo(
    () => getBrandedShareLinkForUserVideo(userVideo.guid),
    [userVideo.guid],
  );

  // Determining if the render button should be enabled or not -----------------
  const userInfoForRender = useUserInfoForRender();

  useEffect(() => {
    setCannotRenderReason(null);

    // If user is not logged in, set cannot render message
    if (!userInfoForRender.isLoggedIn) {
      setCannotRenderReason(CannotRenderReason.NoLogin);
    } else if (
      userInfoForRender.isLoggedIn &&
      userInfoForRender.creditsRemaining <= 0 &&
      !userInfoForRender.hasUnlimitedDownloads
    ) {
      // If user doesn't have enough credits, set cannot render message
      if (userInfoForRender.hasSubscription) {
        setCannotRenderReason(CannotRenderReason.NoCredits);
      } else {
        setCannotRenderReason(CannotRenderReason.NotSubscribed);
      }
    } else if (userInfoForRender.isLoggedIn && userInfoForRender.hasUnlimitedDownloads) {
      // Finally, if a user is logged in and has unlimited downloads, they can render
      setCannotRenderReason(null);
    }
  }, [
    userInfoForRender.isLoggedIn,
    userInfoForRender.creditsRemaining,
    userInfoForRender.hasUnlimitedDownloads,
    userInfoForRender.hasSubscription,
  ]);

  return (
    <CrossFadeTransition transitionKey={String(renderData)}>
      <ModalHeaderSection>
        <WaymarkModalHeading title="Share" />
      </ModalHeaderSection>

      {hasRenderInProgress && !isRenderProgressInfoDismissed ? (
        <InfoBox
          className={styles.VideoShareModalRenderInfoBox}
          colorTheme="Success"
          onClose={() => setIsRenderProgressInfoDismissed(true)}
        >
          <div>
            <p>Video is rendering</p>
            <p>
              Your video is getting rendered and can be found in your account. It can take a few
              minutes, so feel free to close this modal.
            </p>
            <InternalLink underlineMode="always" linkTo={appURLs.accountVideos}>
              View in Account
            </InternalLink>
          </div>
        </InfoBox>
      ) : null}

      {hasRenderInProgress || hasCompletedRender ? (
        <>
          <RenderDownloadOptionList userVideoGUID={userVideo.guid} videoTitle={userVideo.title} />
          <hr className={styles.VideoShareModalDivider} />
        </>
      ) : null}

      {shouldWhiteLabel ? (
        <UserVideoShareLinkInput
          userVideoGUID={userVideo.guid}
          isWhiteLabeled
          label="Preview link"
        />
      ) : null}

      <UserVideoShareLinkInput
        userVideoGUID={userVideo.guid}
        label="Sharing link"
        helpTooltipText="People with this link can watch your video and make editable copies of it in their own account. After finalizing, this same link will have download options."
      />
      {watermarkedPreviewRender && !hasRenderInProgress && !hideRenderDownload ? (
        <>
          <hr className={styles.VideoShareModalDivider} />
          <div className={styles.VideoShareModalDownloadPreviewContainer}>
            <VideoRenderDownloadButton
              render={watermarkedPreviewRender}
              renderDescription="Download preview video"
              userVideoGUID={userVideo.guid}
              videoTitle={userVideo.title}
            />
          </div>
        </>
      ) : null}

      <ModalFooterSection>
        <VideoShareModalFooter
          canUserPurchase={userInfoForRender.canUserPurchase}
          cannotRenderReason={cannotRenderReason}
          adminShareLink={shareLinkURL}
          hideRenderButton={hasCompletedRender || hasRenderInProgress}
          userVideoGUID={userVideo.guid}
          refetchRenderData={refetchRenderData}
        />
      </ModalFooterSection>
    </CrossFadeTransition>
  );
};

export default withWaymarkModal()(VideoShareModalContents);
