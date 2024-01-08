// Vendor
import { useEffect, useState } from 'react';
import { css, cx as emotionClassNames } from '@emotion/css';

import { WaymarkModal } from 'shared/components/WithWaymarkModal';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';
import { ModalHeaderSection } from '@libs/shared-ui-components/src';

interface ConfirmationModalOptions {
  shouldSkipConfirmation?: boolean;
  title: string;
  subtitle?: string;
  confirmButtonText?: string;
  confirmButtonProps?: {
    className?: string;
    [key: string]: any;
  };
  modalProps?: {
    [key: string]: any;
  };
}

/**
 * Hook takes an action callback function which should only be executed after the user
 * confirms via a confirmation modal.
 *
 * @param {function} protectedAction - Callback function which should only be run after the user clicks the confirm button
 * @param {Object} options
 * @param {bool}   [options.shouldSkipConfirmation=false] - If true, we will skip the confirmation flow and the callback method returned from this hook
 *                                                          will just directly call the protectedAction callback. This is useful if we only need to use
 *                                                          the confirmation modal under certain conditions.
 * @param {string} options.title - Title of the confirmation modal
 * @param {string} [options.subtitle] - Subtitle of the confirmation modal
 * @param {string} [options.confirmButtonText] - Text to display on the confirm button
 * @param {Object} [confirmButtonProps] - Custom props to pass to the confirm button
 * @param {Object} [modalProps] - Custom props to pass to the modal
 *
 * @returns {[function, Node]}  Returns an array where the first item is the callback which should be called to open the confirmation modal,
 *                              and the second item is the confirmation modal contents which should be rendered in a React component.
 *
 * @example
 * const [openConfirmationModal, confirmationModalContents] = useConfirmationModalProtectedAction(() => {
 *     console.log("THIS SHOULD ONLY BE RUN AFTER THE USER CLICKS TO CONFIRM");
 *   },
 *   {
 *     title: "Are you sure?",
 *     subtitle: "Click the confirm button to proceed",
 *     confirmButtonText: "Confirm",
 *     modalProps: {
 *      cancelInterface: "text",
 *    },
 *   },
 * );
 *
 * return (
 *   <>
 *     <button onClick={openConfirmationModal}>Open confirmation modal</button>
 *     {confirmationModalContents}
 *   </>
 * );
 */
export const useConfirmationModalProtectedAction = <
  TProtectedAction extends (...args: any[]) => any,
>(
  protectedAction: TProtectedAction,
  options: ConfirmationModalOptions,
) => {
  const {
    shouldSkipConfirmation = false,
    title,
    subtitle,
    confirmButtonText,
    confirmButtonProps: {
      className: confirmButtonClassName = null,
      ...spreadableConfirmButtonProps
    } = {},
    modalProps,
  } = options;

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  useEffect(() => {
    if (shouldSkipConfirmation && isConfirmationModalOpen) {
      setIsConfirmationModalOpen(false);
    }
  }, [shouldSkipConfirmation, isConfirmationModalOpen]);

  if (shouldSkipConfirmation) {
    // If the confirmation modal can be bypassed, just return the action
    // with no confirmation modal
    return [protectedAction, null] as const;
  }

  // If the action isn't disabled and the confirmation modal can't be bypassed,
  // we will construct a modal to render which will call the protected action
  // if the user clicks a confirmation button
  const confirmationModal = (
    <WaymarkModal
      isVisible={isConfirmationModalOpen}
      onCloseModal={() => setIsConfirmationModalOpen(false)}
      {...modalProps}
    >
      <ModalHeaderSection>
        <WaymarkModalHeading title={title} subText={subtitle} />
      </ModalHeaderSection>

      <WaymarkButton
        colorTheme="Primary"
        onClick={() => {
          protectedAction();
          setIsConfirmationModalOpen(false);
        }}
        className={emotionClassNames(
          css`
            display: block;
            width: 100%;
          `,
          confirmButtonClassName,
        )}
        {...spreadableConfirmButtonProps}
      >
        {confirmButtonText}
      </WaymarkButton>
    </WaymarkModal>
  );

  return [
    // The returned callback should just open the confirmation modal
    () => {
      setIsConfirmationModalOpen(true);
    },
    confirmationModal,
  ] as const;
};
