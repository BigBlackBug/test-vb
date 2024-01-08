import { Button } from '../../Button';
import { ModalButtonForm } from './ModalButtonForm';

interface ModalDismissButton extends React.ComponentProps<typeof Button> {
  /**
   * Optional custom children to render inside the button. If not provided, the default "Done" text will be used.
   */
  children?: React.ReactNode;
}

/**
 * A single button to dismiss a modal.
 */
export const ModalDismissButton = ({ ...buttonProps }: ModalDismissButton) => (
  <ModalButtonForm>
    <Button colorTheme="Primary" {...buttonProps}>
      Done
    </Button>
  </ModalButtonForm>
);
