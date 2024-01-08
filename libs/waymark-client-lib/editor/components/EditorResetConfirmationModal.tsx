// Local
import {
  Modal,
  ModalBodyText,
  ModalHeadingText,
  ModalProps,
  ModalButtonForm,
} from '@libs/shared-ui-components';
import { WaymarkButton } from 'shared/components/WaymarkButton';

interface EditorResetConfirmationModalContentsProps extends ModalProps {
  titleText?: string;
  resetButtonText?: string;
  bodyText: string;
  editingAttribute?: string;
  onClickReset: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * Defines the contents for the reset confirmation modal which will be wrapped in a
 * withWaymarkModal HOC
 *
 * @param   {string}  [titleText='Reset to Default']  Modal title text
 * @param   {string}  [resetButtonText='Reset to Default']  Modal reset button text
 * @param   {string}  bodyText                        Modal body text.
 * @param   {string}  [editingAttribute]              The attribute being edited in this modal's base component.
 * @param   {func}    onClickReset                    On confirm reset action.
 */
export default function EditorResetConfirmationModal({
  titleText = 'Reset to Default',
  resetButtonText = 'Reset',
  bodyText,
  editingAttribute = '',
  onClickReset,
  ...props
}: EditorResetConfirmationModalContentsProps) {
  return (
    <Modal {...props}>
      <ModalHeadingText>{titleText}</ModalHeadingText>
      <ModalBodyText>{bodyText}</ModalBodyText>
      <ModalButtonForm>
        <WaymarkButton
          type="submit"
          colorTheme="Negative"
          onClick={onClickReset}
        >{`${resetButtonText}${editingAttribute ? ` ${editingAttribute}` : ''}`}</WaymarkButton>
        <WaymarkButton type="submit" colorTheme="BlackText" hasFill={false}>
          Cancel
        </WaymarkButton>
      </ModalButtonForm>
    </Modal>
  );
}
