// Vendor
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Editor
import {
    BRANDING_STATE
} from 'editor/hooks/autofillService.js';
import BrandItCustomInstructionsUI from 'editor/components/BrandItCustomInstructionsUI.js';
import {
    useSelectedCustomInstructionsCategory,
    useCustomInstructionsText,
} from 'editor/state/brandItCustomInstructions.js';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import WaymarkModalHeading from 'shared/components/WaymarkModalHeading';

// WAYMARK APP DEPENDENCIES
import {
    coreBusinessDetailsPropType
} from 'shared/api/graphql/businesses/fragments';

// Styles
import {
    themeVars
} from '@libs/shared-ui-styles';
import {
    useTypography
} from 'styles/hooks/typography.js';
import {
    dataCaptureDefaultModalFocus
} from 'styles/constants/dataset.js';

// The "Brand It" button should be focused by default first when the modal is opened
// so the user can confirm by just pressing enter
const brandItButtonDataset = {
    [dataCaptureDefaultModalFocus]: true,
};

/**
 * Defines the contents for the brand it confirmation modal
 *
 * @param {func}    applyBrandingToVideo - Callback to confirm and proceed to apply branding to the video
 * @param {bool}    brandingState - The current state of the branding process
 * @param {Object}  businessDetails - The details object for the business which we are going to brand the video with
 */
export default function BrandItModalConfirmationContents({
    applyBrandingToVideo,
    brandingState,
    businessDetails,
}) {
    const businessGUID = businessDetails ? .guid;

    const [selectedUserInstructionsCategoryKey, setSelectedUserInstructionsCategoryKey] =
    useSelectedCustomInstructionsCategory(businessGUID);
    const [userInstructionsText, setUserInstructionsText] = useCustomInstructionsText(businessGUID);

    const [bodySmallTextStyle] = useTypography(['bodySmall']);

    return ( <
        >
        <
        WaymarkModalHeading title = "Brand it with AI"
        subText = "Our AI will intelligently reference your brand with custom script, images, and more."
        className = {
            css `
          text-align: center;
        `
        }
        subTextClassName = {
            bodySmallTextStyle
        }
        />

        <
        BrandItCustomInstructionsUI selectedUserInstructionsCategoryKey = {
            selectedUserInstructionsCategoryKey
        }
        setSelectedUserInstructionsCategoryKey = {
            setSelectedUserInstructionsCategoryKey
        }
        userInstructionsText = {
            userInstructionsText
        }
        setUserInstructionsText = {
            setUserInstructionsText
        }
        />

        { /* If we have an error, display an error message in red text */ } {
            brandingState === BRANDING_STATE.error ? ( <
                p className = {
                    css `
            ${bodySmallTextStyle}
            color: ${themeVars.color.negative.default};
            margin: 0 auto 10px;
            text-align: center;
          `
                } >
                Sorry, something went wrong.Please give it another
                try. <
                /p>
            ) : null
        } {
            /* "Brand it" button applies the currently selected business' base personalized variant configuration
                        to the video and closes the modal */
        } <
        WaymarkButton onClick = {
            () => {
                applyBrandingToVideo(
                    businessDetails,
                    selectedUserInstructionsCategoryKey,
                    userInstructionsText,
                );
            }
        }
        colorTheme = "AI"
        className = {
            css `
          display: block;
          width: 100%;
          max-width: 327px;
          margin: 0 auto;
        `
        }
        isLoading = {
            brandingState === BRANDING_STATE.inProgress
        } { ...brandItButtonDataset
        } >
        Brand it <
        /WaymarkButton> <
        />
    );
}
BrandItModalConfirmationContents.propTypes = {
    applyBrandingToVideo: PropTypes.func.isRequired,
    brandingState: PropTypes.string.isRequired,
    businessDetails: coreBusinessDetailsPropType.isRequired,
};