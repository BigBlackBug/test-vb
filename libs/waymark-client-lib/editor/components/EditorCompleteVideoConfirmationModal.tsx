// Vendor
import withWaymarkModal from 'shared/components/WithWaymarkModal';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';
import { confirmButton } from './EditorCompleteVideoConfirmationModal.css';

interface EditorCompleteVideoConfirmationModalContentsProps {
  /**
   * The title to display at the top of the modal
   */
  title: string;
  /**
   * Main body text to display in the modal
   */
  bodyText: string;
  /**
   * Text to use for the comfirmation button
   */
  confirmButtonText: string;
  /**
   * Proceeds to complete/purchase the video
   */
  onCompleteVideo: () => void;
  /**
   * Closes the modal
   */
  onCloseModal: () => void;
}

/**
 * Modal which will prompt the user whether they want to proceed when they click the buy button
 */
const EditorCompleteVideoConfirmationModalContents = ({
  title,
  bodyText,
  confirmButtonText,
  onCompleteVideo,
  onCloseModal,
}: EditorCompleteVideoConfirmationModalContentsProps) => (
  <>
    <WaymarkModalHeading title={title} subText={bodyText} />
    <WaymarkButton
      colorTheme="Primary"
      onClick={() => {
        // Close the modal and proceed to complete the video
        onCloseModal();
        onCompleteVideo();
      }}
      analyticsAction="selected_confirm_complete_video"
      className={confirmButton}
      data-testid="completeVideoConfirmButton"
    >
      {confirmButtonText}
    </WaymarkButton>
  </>
);

export default withWaymarkModal()(EditorCompleteVideoConfirmationModalContents);
