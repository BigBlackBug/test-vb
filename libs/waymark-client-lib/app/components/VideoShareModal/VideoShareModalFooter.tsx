import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { WaymarkButton } from 'shared/components/WaymarkButton';
import { ExternalLink, InternalLink } from 'shared/components/WaymarkLinks';
import CrossFadeTransition from 'shared/components/CrossFadeTransition.js';

import { useCreateNotificationMessage } from 'app/providers/NotificationMessageProvider';
import { LinkIcon } from 'app/icons/PresenceAndSharingIcons';
import { operations as purchaseOperations } from 'app/state/ducks/purchase/index.js';
import { operations as checkoutOperations } from 'app/state/ducks/checkout/index.js';
import { appURLs } from 'app/constants/urls';
import * as selectors from 'app/state/selectors/index.js';

import * as styles from './VideoShareModalFooter.css';
import { themeVars } from '@libs/shared-ui-styles/src';
import { CannotRenderReason } from './VideoShareModal';
import { useAccountPagePurchasedUserVideos } from 'app/models/userVideos/hooks';

interface VideoShareModalFooterProps {
  canUserPurchase: boolean;
  cannotRenderReason?: CannotRenderReason | null;
  hideRenderButton?: boolean;
  adminShareLink?: string | null;
  userVideoGUID: string;
  refetchRenderData?: (() => void) | null;
}

export const VideoShareModalFooter = ({
  canUserPurchase = true,
  cannotRenderReason = null,
  hideRenderButton = false,
  adminShareLink = null,
  userVideoGUID,
  refetchRenderData = null,
}: VideoShareModalFooterProps) => {
  const [shouldShowRenderConfirmation, setShouldShowRenderConfirmation] = useState<boolean>(false);
  const [isAttemptingCheckout, setIsAttemptingCheckout] = useState<boolean>(false);

  const accountGUID = useSelector(selectors.getAccountGUID);
  // TODO: fix this hack to force the purchased videos to refetch when a render is complete
  const { refetch: refetchPurchasedUserVideos } = useAccountPagePurchasedUserVideos(accountGUID);

  // Render Video --------------------------------------------------------------
  const dispatch = useDispatch();

  const attemptRender = async () => {
    try {
      if (userVideoGUID) {
        setIsAttemptingCheckout(true);
        await dispatch(checkoutOperations.initializeCheckout(userVideoGUID));
        await dispatch(purchaseOperations.attemptVideoCheckoutPurchase());
        setIsAttemptingCheckout(false);
        if (refetchRenderData) {
          refetchRenderData?.();
          refetchPurchasedUserVideos?.();
        }
      } else {
        throw new Error('No user video provided');
      }
    } catch (error) {
      setIsAttemptingCheckout(false);
      console.error(error);
    }
  };

  const createNotificationMessage = useCreateNotificationMessage();

  async function copyTextToClipboard(text: string) {
    return await navigator.clipboard.writeText(text);
  }

  const handleCopyClick = () => {
    if (adminShareLink) {
      copyTextToClipboard(adminShareLink)
        .then(() => {
          createNotificationMessage('Copied', {
            icon: <LinkIcon color={themeVars.color.white} />,
            theme: 'success',
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  return (
    <CrossFadeTransition
      className={styles.VideoShareModalFooterContainer}
      transitionKey={shouldShowRenderConfirmation}
    >
      {shouldShowRenderConfirmation && !hideRenderButton && !cannotRenderReason ? (
        <>
          {canUserPurchase ? (
            <>
              <p className={styles.VideoShareModalInfoMessageHeader}>
                To finalize, please review the following
              </p>
              <p className={styles.VideoShareModalInfoMessage}>
                I have watched this video and have express permission to use all of the content,
                including any copyrighted logos and images, added through Brand It or file upload.
              </p>

              <div className={styles.VideoShareModalConfirmationButtons}>
                <WaymarkButton
                  colorTheme="Secondary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setShouldShowRenderConfirmation(false);
                  }}
                >
                  Cancel
                </WaymarkButton>
                <WaymarkButton
                  colorTheme="Primary"
                  style={{ width: '100%' }}
                  onClick={attemptRender}
                  isLoading={isAttemptingCheckout}
                  isDisabled={isAttemptingCheckout}
                >
                  Accept
                </WaymarkButton>
              </div>
            </>
          ) : (
            <>
              <p className={styles.VideoShareModalInfoMessageHeader}>
                Admin permission needed to render
              </p>
              <p className={styles.VideoShareModalInfoMessage}>
                Send the sharing link to your team admin for approval to download in digital and TV
                qualities.
              </p>

              <div className={styles.VideoShareModalConfirmationButtons}>
                <WaymarkButton
                  colorTheme="Secondary"
                  style={{ width: '100%' }}
                  onClick={() => setShouldShowRenderConfirmation(false)}
                >
                  Cancel
                </WaymarkButton>
                <WaymarkButton
                  onClick={() => handleCopyClick()}
                  colorTheme="Primary"
                  style={{ width: '100%' }}
                >
                  Copy To Share
                </WaymarkButton>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {!hideRenderButton ? (
            // If a render has already been initiated (or is done!) we don't want to show the render button
            <WaymarkButton
              isDisabled={Boolean(cannotRenderReason)}
              style={{ width: '100%' }}
              colorTheme="Primary"
              onClick={() => setShouldShowRenderConfirmation(true)}
            >
              Render And Download
            </WaymarkButton>
          ) : null}
        </>
      )}

      {cannotRenderReason === CannotRenderReason.NoLogin ? (
        <>
          <p className={styles.VideoShareModalWarningMessage}>
            Subscribe to download your video.{' '}
            <ExternalLink underlineMode="always" linkTo={'https://waymark.com/marketing/pricing'}>
              See Pricing
            </ExternalLink>
          </p>

          <p className={styles.VideoShareModalWarningMessage}>
            If you have a coupon,{' '}
            <InternalLink underlineMode="always" linkTo={appURLs.checkoutCoupon}>
              click here.
            </InternalLink>
          </p>
        </>
      ) : null}

      {cannotRenderReason === CannotRenderReason.NotSubscribed && !hideRenderButton ? (
        <>
          <p className={styles.VideoShareModalWarningMessage}>
            Subscribe to download your video.{' '}
            <ExternalLink underlineMode="always" linkTo={'https://waymark.com/marketing/pricing'}>
              See Pricing
            </ExternalLink>
          </p>

          <p className={styles.VideoShareModalWarningMessage}>
            If you have a coupon,{' '}
            <ExternalLink underlineMode="always" linkTo={appURLs.checkoutCoupon}>
              click here.
            </ExternalLink>
          </p>
        </>
      ) : null}

      {cannotRenderReason === CannotRenderReason.NoCredits && !hideRenderButton ? (
        <>
          <p className={styles.VideoShareModalWarningMessage}>
            Credit limit reached. Upgrade your plan or contact support for further assistance.{' '}
            <br />
            <ExternalLink underlineMode="always" linkTo={'https://waymark.com/marketing/pricing'}>
              See Pricing
            </ExternalLink>
          </p>

          <p className={styles.VideoShareModalWarningMessage}>
            If you have a coupon,{' '}
            <ExternalLink underlineMode="always" linkTo={appURLs.checkoutCoupon}>
              click here.
            </ExternalLink>
          </p>
        </>
      ) : null}
    </CrossFadeTransition>
  );
};
