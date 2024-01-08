// Vendor
import { useEffect, useRef, useCallback, Fragment } from 'react';
import { css, cx as emotionClassNames } from '@emotion/css';

// Shared
import ToggleSlideFadeTransition, {
  SlideDirections,
} from 'shared/components/ToggleSlideFadeTransition';
import { WaymarkButton } from 'shared/components/WaymarkButton';
import { getComponentDisplayName } from 'shared/utils/react.js';
import Portal from 'shared/components/Portal.js';
import keyCodes from 'shared/utils/keyCodes.js';
import { lockScrollPosition } from 'shared/utils/dom.js';
import useAddEventListener from 'shared/hooks/useAddEventListener';

// Styles
import breakpoints from 'styles/constants/breakpoints.js';
import { dataCaptureDefaultModalFocus } from 'styles/constants/dataset.js';
import { themeVars } from '@libs/shared-ui-styles';
import { useIsWindowMobile } from 'app/hooks/windowBreakpoint';
import { CloseIcon } from 'app/icons/BasicIcons';
import { ModalFooterSection } from '@libs/shared-ui-components/src';

enum CancelInterfaceTypes {
  Button = 'button',
  Text = 'text',
  X = 'x',
}

enum ModalPositions {
  Center = 'center',
  Left = 'left',
  Right = 'right',
}

enum ModalSizePreset {
  Large = 'large',
  Medium = 'medium',
  Small = 'small',
}

const MODAL_SIZE_PRESET_VALUES: {
  [key in ModalSizePreset]: string;
} = {
  [ModalSizePreset.Large]: '750px',
  [ModalSizePreset.Medium]: '560px',
  [ModalSizePreset.Small]: '327px',
};

// Selector that can be passed to querySelectorAll to get ALL valid elements that can receive keyboard focus
const keyboardfocusableElementsSelector =
  'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';

const isKeyboardEvent = (event: Event): event is KeyboardEvent => 'key' in event;

export interface WaymarkModalProps {
  isVisible: boolean;
  onCloseModal: () => void;
  cancelInterface?: `${CancelInterfaceTypes}` | null;
  cancelButtonText?: string;
  animationDirection?: `${SlideDirections}`;
  modalPosition?: `${ModalPositions}`;
  modalSize?: `${ModalSizePreset}` | string;
  shouldFillWindowHeight?: boolean;
  shouldAllowDismissal?: boolean;
  shouldRenderTopLevel?: boolean;
  modalHeaderID?: string;
  modalDescriptionID?: string;
  className?: string;
  wrapperClassName?: string;
  children: React.ReactNode;
}

/**
 * @name WaymarkModal
 *
 * @param {bool}    [isVisible=false]              - Is the modal visible
 * @param {func}    onCloseModal                   - What should happen when the cancel/close actions are taken. No-op isn't an option as that would lock the interface to open.
 * @param {bool}    [shouldAllowDismissal=true]    - Should we allow this modal to be dismissed, we'll default to true to avoid the dark pattern of blocking peoples navigation.
 * @param {string}  [modalPosition="center"]       - How the modal should be positioned horizontally in the window (options are "left", "center", or "right")
 * @param {string}  [modalSize="small"]            - Either a preset defining how wide the modal should be (options are "small", "medium", or "large") or a custom pixel value
 * @param {bool}    [shouldFillWindowHeight=false] - Whether the modal should at a minimum be tall enough to fill the window's height
 * @param {string}  [animationDirection='up']      - Which direction do you want this thing to come in from.
 * @param {string}  [cancelInterface='']           - Provided cancel interface, default to none to allow for custom cancel interfaces using the callback.
 * @param {string}  [cancelButtonText="Cancel"]    - If a cancel interface has been provided, sets the text that will be in the button
 * @param {bool}    [shouldRenderTopLevel=true]    - Whether the modal should be pulled out to the top level on the DOM
 * @param {string}  [modalHeaderID]                - ID for the element whose contents are most representative as the header of the modal, to be set on aria-labelledby for screen readers
 * @param {string}  [modalDescriptionID]           - ID for the element whose contents are most representative as a subheader/description of the modal contents, to be set on aria-describedby for screen readers
 */
export const WaymarkModal = ({
  isVisible,
  onCloseModal,
  shouldAllowDismissal = true,
  modalPosition = ModalPositions.Center,
  modalSize = ModalSizePreset.Small,
  shouldFillWindowHeight = false,
  animationDirection = SlideDirections.Up,
  cancelInterface = null,
  cancelButtonText = 'Cancel',
  shouldRenderTopLevel = true,
  modalHeaderID = undefined,
  modalDescriptionID = undefined,
  className = '',
  wrapperClassName = '',
  children,
}: WaymarkModalProps) => {
  const modalContentsWrapperRef = useRef<HTMLDivElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Get all elements currently inside the modal which are keyboard focusable
  const getKeyboardFocusableModalContentElements = useCallback(() => {
    const modalContentsWrapper = modalContentsWrapperRef.current;
    if (!modalContentsWrapper) {
      return null;
    }

    return modalContentsWrapper.querySelectorAll(
      keyboardfocusableElementsSelector,
    ) as NodeListOf<HTMLElement>;
  }, []);

  // Effect locks page scrolling when the modal is opened and unlocks page scrolling when the modal is closed
  useEffect(() => {
    if (isVisible) {
      // Lock scrolling on the page underneath the modal
      const unlockScrollPosition = lockScrollPosition();

      // Unlock page scrolling on cleanup when isVisible changes to false or the component is unmounted
      return unlockScrollPosition;
    }

    return undefined;
  }, [isVisible]);

  // Effect focuses an element inside the modal when it's opened and restores to the previously
  // focused element when closed
  useEffect(() => {
    // If the modal is hidden return early because we don't have anything to do
    if (!isVisible || !modalContentsWrapperRef.current) {
      return undefined;
    }

    let previouslyFocusedElement: HTMLElement | null = null;

    // If focus is not already inside the modal,
    // shift focus to the first focusable element in the modal
    if (
      !document.activeElement ||
      !modalContentsWrapperRef.current.contains(document.activeElement)
    ) {
      if (document.activeElement) {
        // Hang onto whatever the previously focused element was so we can restore focus to that
        // when we close the modal
        previouslyFocusedElement = document.activeElement as HTMLElement;
      }

      // Check if the modal contains any element with a data-capture-default-modal-focus dataset
      // attribute, indicating that it should receive our initial default focus when the modal is opened
      // regardless of whether it's the first focusable element in the modal
      const defaultFocusElement = modalContentsWrapperRef.current.querySelector(
        `[${dataCaptureDefaultModalFocus}]`,
      ) as HTMLElement;

      if (defaultFocusElement) {
        defaultFocusElement.focus();
      } else {
        // If we don't have a clear default element to focus, focus the first one that's focusable
        const keyboardFocusableElements = getKeyboardFocusableModalContentElements();
        keyboardFocusableElements?.[0]?.focus();
      }
    }

    return () => {
      // On cleanup, attempt to restore focus to the element that was previously
      // focused before the modal was opened
      previouslyFocusedElement?.focus();
    };
  }, [isVisible, getKeyboardFocusableModalContentElements]);

  // Set up event handler to keep focus inside the modal when the user tabs
  useAddEventListener(window, 'keydown', (event) => {
    if (!isKeyboardEvent(event)) {
      return;
    }

    // If the user hit the tab key to change focus, make sure we keep the focus inside the modal; if they tab past the last focusable
    // element in the modal, we'll wrap them around to the first focusable element in the modal and vice versa
    if (event.key === 'Tab' || event.keyCode === keyCodes.TAB) {
      const keyboardFocusableElements = getKeyboardFocusableModalContentElements();

      if (keyboardFocusableElements && keyboardFocusableElements.length > 0) {
        const firstFocusableElement = keyboardFocusableElements[0];
        const lastFocusableElement =
          keyboardFocusableElements[keyboardFocusableElements.length - 1];

        if (event.shiftKey) {
          // If the shift key was pressed to tab back, check if we're currently focused on the first
          // focusable element in the modal and if so, loop focus back around to the last focusable element
          // to make sure we keep focus locked inside the modal
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            // Prevent default browser handling for shifting focus since we're manually doing it ourselves
            event.preventDefault();
          }
        }
        // If we're tabbing forward, check if we're currently focused on the last
        // focusable element in the modal and if so, loop focus back around to the first focusable element
        // to make sure we keep focus locked inside the modal
        else if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          event.preventDefault();
        }
      }
    }
  });

  const isMobile = useIsWindowMobile();

  // Set up event handlers to close the modal if the user clicks outside of it
  // The modal is only dismissible if it is open and the shouldAllowDismissal prop is true
  const isModalDismissable = isVisible && shouldAllowDismissal;

  const isUserClickingOnModalRef = useRef(false);
  useAddEventListener(window, 'mousedown', (event) => {
    if (modalContentsWrapperRef.current?.contains(event.target as HTMLElement)) {
      // When the user mouses down inside of the modal, update our ref to indicate that the user is
      // currently clicking on the modal; we'll use this to make sure we don't accidentally close the
      // modal if they then drag their mouse outside of the modal and release the mouse button
      // since that counts as a click outside of the modal
      isUserClickingOnModalRef.current = true;
    }
  });
  useAddEventListener(window, 'mouseup', (event) => {
    // If the modal contents aren't mounted, don't do anything
    if (!modalContentsWrapperRef.current) {
      return;
    }

    if (
      isUserClickingOnModalRef.current ||
      modalContentsWrapperRef.current?.contains(event.target as HTMLElement)
    ) {
      // If the click originated from inside the modal or ended inside the modal we don't want to close the modal so just
      // update our ref to indicate the user is no longer holding the mouse down
      isUserClickingOnModalRef.current = false;
    } else if (isModalDismissable && modalContainerRef.current === (event.target as HTMLElement)) {
      // Otherwise if the click was specifically on the container outside of the modal and the modal is dismissible,
      // close the modal
      onCloseModal();
    }
  });

  // Set up event handler to close the modal if the user hits the esc key
  useAddEventListener(window, 'keydown', (event) => {
    if (!isKeyboardEvent(event)) {
      return;
    }

    if (
      // If the modal is dismissable and the user hit the Esc key, close the modal
      isModalDismissable &&
      (event.key === 'Escape' || event.key === 'Esc' || event.keyCode === keyCodes.ESCAPE)
    ) {
      onCloseModal();
    }
  });

  const RenderLevelWrapper = shouldRenderTopLevel ? Portal : Fragment;

  const hasFilledCancelButton = cancelInterface === CancelInterfaceTypes.Button;

  // modalSize prop can be preset or custom width
  const modalMaxWidth =
    modalSize in MODAL_SIZE_PRESET_VALUES
      ? MODAL_SIZE_PRESET_VALUES[modalSize as ModalSizePreset]
      : modalSize;

  return (
    <RenderLevelWrapper>
      <div
        ref={modalContainerRef}
        className={emotionClassNames(
          css`
            position: fixed;
            height: 100%;
            width: 100%;
            top: 0;
            bottom: 0;
            left: 0;
            right: 0;
            overflow-y: auto;
            padding: 32px 0;
            z-index: 100;

            display: flex;
            flex-direction: column;

            /* Disable pointer events on modal when hidden */
            pointer-events: none;
            visibility: hidden;

            /* Disable text highlighting on modal and its contents while opening so
              presses don't accidentally highlight text as it animates in */
            user-select: none;

            /* When the modal is closing, we should transition user-select's value immediately but hang onto
                visibility: visible until the modal is done fading out */
            transition: user-select 0s 0s, visibility 0s 0.2s;

            &.isVisible {
              pointer-events: auto;
              user-select: auto;
              visibility: visible;

              /* When the modal is opening, we should hang onto user-select: none until it's fully transitioned but transition
                  to visibility: visible immediately  */
              transition: user-select 0s 0.2s, visibility 0s 0s;
            }

            /* Use ::after pseudo-element for our darkened modal background */
            &::after {
              content: ' ';
              position: fixed;
              top: 0;
              left: 0;
              bottom: 0;
              right: 0;
              z-index: 0;

              opacity: 0;

              background-color: ${themeVars.color.shadow._56};
              transition: opacity 0.2s ease-in-out;
            }

            &.isVisible::after {
              opacity: 1;
            }

            &.shouldCloseOnClickOutsideModal::after {
              cursor: pointer;
            }

            &.shouldFillWindowHeight {
              padding: 24px 0;
            }
          `,
          {
            isVisible,
            shouldCloseOnClickOutsideModal: shouldAllowDismissal && !isMobile,
            shouldFillWindowHeight,
          },
          className,
        )}
      >
        <ToggleSlideFadeTransition
          isVisible={isVisible}
          direction={animationDirection}
          shouldReverseOnExit
          data-modal-position={modalPosition}
          slideAmount="4rem"
          className={emotionClassNames(
            css`
              background-color: ${themeVars.color.white};
              border-radius: 8px;
              /* Modals should expand to cover as much of the window as possible while leaving
                 at least 24px of space on the left and right  */
              width: calc(100% - 48px);
              padding: 24px 24px 24px;
              box-shadow: 0 8px 16px 4px rgba(17, 17, 30, 0.24);
              position: relative;
              /* Ensure our contents display on top of the background close button */
              z-index: 1;
              max-width: ${modalMaxWidth};

              /* By default, the modal should be centered vertically and horizontally */
              margin: auto;

              @media ${breakpoints.medium.queryUp} {
                /* On desktop, we should respect modal by setting the appropriate margin
                    to shift the modal over to that side of the page */
                &[data-modal-position='${ModalPositions.Left}'] {
                  margin-left: 32px;
                }

                &[data-modal-position='${ModalPositions.Right}'] {
                  margin-right: 24px;
                }
              }

              @media ${breakpoints.small.queryDown} {
                /* On mobile we decrease the padding to 20px and increase the width to make better use of the available space */
                overflow-x: hidden;
                padding: 20px;
                width: calc(100% - 24px);
              }

              &.shouldFillWindowHeight {
                flex: 1;
                height: 100%;
                overflow-y: auto;

                /* Since the full height modal supports horizontal scrolling, its contents need to be able
                to manage the modal padding and margins */
                padding: 0;
              }
            `,
            {
              shouldFillWindowHeight,
            },
            wrapperClassName,
          )}
          ref={modalContentsWrapperRef}
          // Accessibility!
          // Set the element's role to "dialog" to indicate its contents are separate from the base page
          role="dialog"
          // Indicate top screen readers that this is a modal which is displayed on top of the rest of the page
          aria-modal="true"
          // Hide the content from screen readers when the modal isn't visible
          aria-hidden={!isVisible}
          aria-labelledby={modalHeaderID}
          aria-describedby={modalDescriptionID}
        >
          {(shouldAllowDismissal && cancelInterface === CancelInterfaceTypes.X) ||
          (shouldAllowDismissal && isMobile) ? (
            <WaymarkButton
              className={css`
                padding: 16px 12px;
                position: absolute !important;
                right: 0;
                top: 0;
                z-index: 1000;
                svg {
                  width: 1.375rem;
                  height: auto;
                }
              `}
              onClick={onCloseModal}
              hasFill={false}
              data-testid="modalCancelButton"
            >
              <CloseIcon width="22px" height="22px" />
            </WaymarkButton>
          ) : null}

          {children}

          {shouldAllowDismissal &&
          ((cancelInterface === CancelInterfaceTypes.Button && !isMobile) ||
            cancelInterface === CancelInterfaceTypes.Text) ? (
            <ModalFooterSection>
              <WaymarkButton
                className={emotionClassNames(
                  css`
                    width: 100%;
                  `,
                )}
                hasFill={hasFilledCancelButton}
                colorTheme={hasFilledCancelButton ? 'Primary' : 'BlackText'}
                onClick={onCloseModal}
                data-testid="modalCancelButton"
              >
                {cancelButtonText}
              </WaymarkButton>
            </ModalFooterSection>
          ) : null}
        </ToggleSlideFadeTransition>
      </div>
    </RenderLevelWrapper>
  );
};

// withWaymarkModal HOC components don't accept children because the wrapped
// component is supposed to be the child
export type BaseModalHOCProps = Omit<WaymarkModalProps, 'children'>;

/**
 * HOC takes a component and wraps it with a WaymarkModal
 */
const withWaymarkModal = () => {
  function componentFactory<TWrappedComponentProps>(
    WrappedComponent:
      | React.FC<TWrappedComponentProps>
      | React.ComponentClass<TWrappedComponentProps>,
  ) {
    const WaymarkModalHOC: React.FC<BaseModalHOCProps & TWrappedComponentProps> = (props) => (
      <WaymarkModal {...props}>
        <WrappedComponent {...props} />
      </WaymarkModal>
    );

    WaymarkModalHOC.displayName = `WaymarkModal(${getComponentDisplayName(WrappedComponent)})`;
    return WaymarkModalHOC;
  }

  return componentFactory;
};

export default withWaymarkModal;

export const WaymarkModalWrapper = WaymarkModal;
