import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import classNames from 'classnames';
import 'dialog-polyfill';

import { Portal } from '../Portal';

import * as styles from './Modal.css';

export interface ModalProps extends React.HTMLAttributes<HTMLDialogElement> {
  /**
   * Optional boolean to control whether the modal is open or closed.
   * If not provided, the modal will be uncontrolled and will manage its own state.
   * (an uncontrolled component can be opened with `modalRef.current.showModal()` and manually closed with `modalRef.current.close()`)
   */
  isOpen?: boolean;
  /**
   * Optional callback that will be called when the modal is closed.
   * This can be used if you need to track when an uncontrolled modal is closed,
   * or to update the state of a controlled modal when the user closes it.
   */
  onClose?: HTMLDialogElement['onclose'];
  /**
   * Optional size preset to apply to the modal.
   * Set to null or "custom" to disable the default size preset and apply your own width.
   *
   * @default "small"
   */
  size?: `${styles.ModalSize}` | null;
  /**
   * Optional boolean to control whether the modal can be closed.
   * Use this with extreme caution! And remember, users can open the inspector and delete this element,
   * so we can't entirely rely on this to prevent users from doing something they shouldn't.
   *
   * @default true
   */
  isDismissable?: boolean;
}

/**
 * A modal dialog component. The dialog element will be rendered as a child of the <body> element to avoid potential stacking context weirdness.
 */
export const Modal = forwardRef<HTMLDialogElement, ModalProps>(
  (
    {
      isOpen = undefined,
      onClose = undefined,
      size = styles.ModalSize.small,
      isDismissable = true,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    // Allow parent components to access the dialog element as a ref
    useImperativeHandle(ref, () => dialogRef.current as HTMLDialogElement);

    useEffect(() => {
      // If isOpen is undefined, this is an uncontrolled component so don't worry about it
      if (isOpen === undefined) {
        return;
      }

      // If isOpen is defined, this is a controlled component so we need to open or close the dialog
      // based on its value
      if (isOpen) {
        dialogRef.current?.showModal();
      } else if (isDismissable) {
        dialogRef.current?.close();
      }
    }, [isDismissable, isOpen]);

    useEffect(() => {
      // If the dialog is not dismissable, we should intercept and prevent default behavior
      // of the `cancel` and `close` events which can be triggered by the Esc key
      const dialogElement = dialogRef.current;
      if (!dialogElement || isDismissable) {
        return;
      }

      const preventDefault = (evt: Event) => evt.preventDefault();

      dialogElement.addEventListener('cancel', preventDefault);
      dialogElement.addEventListener('close', preventDefault);

      return () => {
        dialogElement.removeEventListener('cancel', preventDefault);
        dialogElement.removeEventListener('close', preventDefault);
      };
    }, [isDismissable]);

    useEffect(() => {
      // If we have an onClose handler and the modal is dismissable, we should subscribe it to close events on the dialog element
      const dialogElement = dialogRef.current;
      if (!dialogElement || !onClose || !isDismissable) {
        return;
      }

      // The dialog element will emit a 'close' event when the dialog is closed. This can happen when `dialogElement.close()` is manually called,
      // or when the dialog is closed via some other means (e.g. pressing the ESC key or submitting a form with method="dialog")
      dialogElement.addEventListener('close', onClose);

      return () => {
        dialogElement.removeEventListener('close', onClose);
      };
    }, [isDismissable, onClose]);

    // Native dialogs don't close when you click outside of them by default, so we'll add that
    // functionality in this effect
    useEffect(() => {
      const dialogElement = dialogRef.current;
      if (!dialogElement || !isDismissable) {
        return;
      }

      const onClickOutsideDialog = (e: MouseEvent) => {
        // Clicks on the backdrop pseudo-element will register as clicks on the dialog element,
        // so we should only check clicks on the dialog element itself
        if (e.target !== dialogElement) {
          return;
        }

        // Get the bounding rect of the dialog element so we can check if the click
        // landed outside of the dialog element
        // (even though the backdrop counts as part of the dialog element, it is not included in the bounding rect)
        const {
          x: dialogX,
          y: dialogY,
          width: dialogWidth,
          height: dialogHeight,
        } = dialogElement.getBoundingClientRect();

        if (
          e.clientX < dialogX ||
          e.clientX > dialogX + dialogWidth ||
          e.clientY < dialogY ||
          e.clientY > dialogY + dialogHeight
        ) {
          // If the click landed outside the main dialog element, close the dialog
          dialogElement.close();
        }
      };

      dialogElement.addEventListener('click', onClickOutsideDialog);
      return () => {
        dialogElement.removeEventListener('click', onClickOutsideDialog);
      };
    }, [isDismissable]);

    return (
      <Portal>
        <dialog
          className={classNames(styles.ModalDialog, className)}
          {...styles.dataModalSize(size || styles.ModalSize.custom)}
          ref={dialogRef}
          {...props}
        >
          {children}
        </dialog>
      </Portal>
    );
  },
);
