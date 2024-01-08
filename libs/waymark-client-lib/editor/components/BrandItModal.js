// Vendor
import {
    useCallback,
    useEffect,
    useRef
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Editor
import BrandItModalConfirmationContents from 'editor/components/BrandItModalConfirmationContents.js';
import BrandItModalInProgressContents from 'editor/components/BrandItModalInProgressContents.js';
import {
    useEditorPanelDispatch
} from 'editor/providers/EditorPanelProvider';
import {
    editorPanelKeys
} from 'editor/constants/Editor';
import {
    useEditorDispatch
} from 'editor/providers/EditorStateProvider.js';
import {
    useApplyBrandingToVideo,
    BRANDING_STATE
} from 'editor/hooks/autofillService.js';

// Shared
import {
    WaymarkModal
} from 'shared/components/WithWaymarkModal';
import {
    RotatingLoader
} from '@libs/shared-ui-components';
import CrossFadeTransition from 'shared/components/CrossFadeTransition.js';

// WAYMARK APP DEPENDENCIES
import {
    coreBusinessDetailsPropType
} from 'shared/api/graphql/businesses/fragments';

/**
 * Renders contents for the BrandItModal component
 *
 * @param {func} onCloseModal - Callback function to close the modal
 * @param {string} brandingState - The current state that the autofill branding application process is in
 * @param {func} applyBrandingToVideo - Function takes a business details object and applies its branding to the video
 * @param {Object} businessDetails - The business details object for the business which we want to brand the video for
 */
function BrandItModalContents({
    onCloseModal,
    brandingState,
    applyBrandingToVideo,
    businessDetails,
}) {
    const {
        closeControlPanel
    } = useEditorPanelDispatch();
    const {
        onStopEditingBusiness
    } = useEditorDispatch();

    const didBrandingSucceed = brandingState === BRANDING_STATE.success;

    const hasRunPostSuccessCleanupRef = useRef(false);

    /**
     * Performs some state cleanup and closes the modal after branding has succeeded
     */
    const cleanUpAndCloseModalAfterSuccess = useCallback(() => {
        // If we've already run this cleanup, don't run it again
        if (hasRunPostSuccessCleanupRef.current) return;

        hasRunPostSuccessCleanupRef.current = true;
        // Close the modal
        onCloseModal();
        // Close the business profiles panel
        closeControlPanel({
            targetPanelKey: editorPanelKeys.main,
        });
        // Nullify any editing business
        onStopEditingBusiness();
    }, [onCloseModal, onStopEditingBusiness, closeControlPanel]);

    // Effect closes the modal and returns the editor to the main panel when branding succeeds,
    // with a small delay applied to allow the progress bar to animate to full first
    useEffect(() => {
        if (!didBrandingSucceed) return undefined;

        // When branding is complete, wait for half a second to give the user a chance to see the progress bar completed and then close the modal and clean things up
        const timeoutID = setTimeout(cleanUpAndCloseModalAfterSuccess, 500);

        return () => {
            clearTimeout(timeoutID);
            // If the modal was unmounted before we could run the delayed cleanup method, make sure we run it now
            cleanUpAndCloseModalAfterSuccess();
        };
    }, [didBrandingSucceed, cleanUpAndCloseModalAfterSuccess]);

    if (!businessDetails) {
        // If we don't have business details loaded/available, show a loading spinner until it finishes loading
        return ( <
            RotatingLoader className = {
                css `
          width: 48px;
          height: 48px;
          margin: 12px auto;
          display: block;
        `
            }
            />
        );
    }

    // We should show a progress bar if branding is in progress or has succeeded; after hitting the success state,
    // the modal will automatically close itself after a short delay
    const shouldShowBrandingProgressBar =
        didBrandingSucceed || brandingState === BRANDING_STATE.inProgress;

    return ( <
        CrossFadeTransition transitionKey = {
            shouldShowBrandingProgressBar ? 'progress' : 'confirmation'
        } >
        {
            shouldShowBrandingProgressBar ? ( <
                BrandItModalInProgressContents didBrandingSucceed = {
                    didBrandingSucceed
                }
                />
            ) : ( <
                BrandItModalConfirmationContents applyBrandingToVideo = {
                    applyBrandingToVideo
                }
                brandingState = {
                    brandingState
                }
                businessDetails = {
                    businessDetails
                }
                />
            )
        } <
        /CrossFadeTransition>
    );
}
BrandItModalContents.propTypes = {
    onCloseModal: PropTypes.func.isRequired,
    brandingState: PropTypes.string.isRequired,
    applyBrandingToVideo: PropTypes.func.isRequired,
    businessDetails: coreBusinessDetailsPropType,
};
BrandItModalContents.defaultProps = {
    businessDetails: null,
};

/**
 * Renders a modal which can be used to apply branding to a video in the editor
 *
 * @param {bool}  isVisible - Whether the modal should be open
 * @param {func}  onCloseModal - Callback function to close the modal
 * @param {Object} businessDetails - The business details object for the business which we want to brand the video for
 */
export default function BrandItModal({
    isVisible,
    onCloseModal,
    businessDetails
}) {
    const {
        applyBrandingToVideo,
        resetBrandingState,
        brandingState
    } = useApplyBrandingToVideo();

    const closeModalAndResetState = () => {
        onCloseModal();
        // Reset the branding state when the modal is closed so
        // any success or error state will be cleared when the modal is opened again
        resetBrandingState();
    };

    const isBrandingInProgress =
        brandingState === BRANDING_STATE.inProgress || brandingState === BRANDING_STATE.success;

    return ( <
        WaymarkModal
        // Don't allow the modal to be dismissed if branding is in progress to ensure
        // the user can't touch anything in the editor until it's safe to do so
        shouldAllowDismissal = {!isBrandingInProgress
        }
        isVisible = {
            isVisible
        }
        onCloseModal = {
            closeModalAndResetState
        }
        // The modal should be small when we're only showing a progress bar or in the final success state
        modalSize = {
            isBrandingInProgress ? 'small' : 'medium'
        } >
        <
        BrandItModalContents onCloseModal = {
            closeModalAndResetState
        }
        brandingState = {
            brandingState
        }
        applyBrandingToVideo = {
            applyBrandingToVideo
        }
        businessDetails = {
            businessDetails
        }
        /> <
        /WaymarkModal>
    );
}
BrandItModal.propTypes = {
    isVisible: PropTypes.bool.isRequired,
    onCloseModal: PropTypes.func.isRequired,
    businessDetails: coreBusinessDetailsPropType,
};
BrandItModal.defaultProps = {
    businessDetails: null,
};