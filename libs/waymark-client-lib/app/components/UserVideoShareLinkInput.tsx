// Vendor
import { useMemo } from 'react';

// Local
import CopyTextInput from 'app/components/CopyTextInput';
import PopupLabelWrapper from 'app/components/PopupLabelWrapper';
import {
  getBrandedShareLinkForUserVideo,
  getWhiteLabeledShareLinkForUserVideo,
} from 'app/state/ducks/userVideos/utils.js';
import { useCreateNotificationMessage } from 'app/providers/NotificationMessageProvider.js';
import { LinkIcon } from 'app/icons/PresenceAndSharingIcons';
import { HelpQuestionMarkIcon } from 'app/icons/ContactAndHelpIcons';
import { whiteColor } from 'styles/themes/waymark/colors.js';
import { dataCaptureDefaultModalFocus } from 'styles/constants/dataset.js';

import * as styles from './UserVideoShareLinkInput.css';

// The copy text input should be focused by default first when the modal is opened
const copyShareLinkInputDataset = {
  [dataCaptureDefaultModalFocus]: true,
};

interface UserVideoShareLinkInputProps {
  userVideoGUID: string;
  label: string;
  helpTooltipText?: string | null;
  isWhiteLabeled?: boolean;
}

/**
 * Displays a copy input for copying a sharable link for a user video and
 * offers the ability to share
 *
 * @param {string}  userVideoGUID
 * @param {string}  label                           Label to display above input
 * @param {bool}    [isWhiteLabeled=false]          Whether the share link should be white labeled
 */
const UserVideoShareLinkInput = ({
  userVideoGUID,
  label,
  helpTooltipText = null,
  isWhiteLabeled = false,
}: UserVideoShareLinkInputProps) => {
  const shareLinkURL = useMemo(
    () =>
      isWhiteLabeled
        ? getWhiteLabeledShareLinkForUserVideo(userVideoGUID)
        : getBrandedShareLinkForUserVideo(userVideoGUID),
    [userVideoGUID, isWhiteLabeled],
  );

  const createNotificationMessage = useCreateNotificationMessage();

  return (
    <div className={styles.ShareInputWrapper}>
      <CopyTextInput
        label={
          <>
            {label}
            {helpTooltipText && (
              <PopupLabelWrapper label={helpTooltipText} className={styles.HelpTooltip}>
                <HelpQuestionMarkIcon />
              </PopupLabelWrapper>
            )}
          </>
        }
        copyTextValue={shareLinkURL}
        onCopySuccess={() =>
          createNotificationMessage('Copied', {
            icon: <LinkIcon color={whiteColor} />,
            theme: 'success',
          })
        }
        className={styles.CopySharableLinkInput}
        {...copyShareLinkInputDataset}
      />
    </div>
  );
};

export default UserVideoShareLinkInput;
