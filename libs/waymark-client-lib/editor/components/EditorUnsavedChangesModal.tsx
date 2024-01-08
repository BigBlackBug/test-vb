// Vendor
import withWaymarkModal from 'shared/components/WithWaymarkModal';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';

import { confirmButton } from './EditorUnsavedChangesModal.css';

interface EditorUnsavedChangesModalContentsProps {
  title: string;
  warningMessage: string;
  confirmButtonText: string;
  /**
   * Callback fired when the user clicks the confirm button
   */
  onClickDiscardChanges: () => void;
}

/**
 * Modal which will prompt the user if they clicked the exit button in the editor without saving
 */
const EditorUnsavedChangesModalContents = ({
  title,
  warningMessage,
  confirmButtonText,
  onClickDiscardChanges,
}: EditorUnsavedChangesModalContentsProps) => (
  <>
    <WaymarkModalHeading title={title} subText={warningMessage} />
    <WaymarkButton
      colorTheme="Negative"
      // Mark that we don't want to preserve our unsaved changes and proceed to close the editor
      onClick={onClickDiscardChanges}
      analyticsAction="selected_confirm_exit_without_saving"
      className={confirmButton}
      data-testid="unsavedChangesModalConfirmButton"
    >
      {confirmButtonText}
    </WaymarkButton>
  </>
);

export default withWaymarkModal()(EditorUnsavedChangesModalContents);
