// Vendor

// Shared
import { WaymarkButton } from 'shared/components/WaymarkButton';
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';
import withWaymarkModal from 'shared/components/WithWaymarkModal';

import * as styles from './EditorFileUploadErrorModal.css';

interface EditorFileUploadErrorModalContentsProps {
  /** File upload error message  */
  errorMessage: string | null;
  /** Closes the long press action modal */
  onCloseModal: () => void;
  /** Modal title */
  title: string | React.ReactNode;
}

/**
 * Modal contents display an error message related to file upload.
 */
const EditorFileUploadErrorModalContents = ({
  errorMessage,
  onCloseModal,
  title,
}: EditorFileUploadErrorModalContentsProps) => (
  <>
    <WaymarkModalHeading
      className={styles.UploadErrorModalTitle}
      title={title}
      subText={errorMessage}
    />
    <WaymarkButton
      className={styles.UploadErrorModalButton}
      colorTheme="Primary"
      onClick={onCloseModal}
    >
      Okay
    </WaymarkButton>
  </>
);

export default withWaymarkModal()(EditorFileUploadErrorModalContents);
