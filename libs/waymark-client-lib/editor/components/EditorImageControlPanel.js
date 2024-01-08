// Vendor
import {
    useState,
    useEffect
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Editor
import HeaderButtonRow from 'editor/components/EditorControlPanelHeaderButtonRow.js';
import TemplateImagesEditPanel from 'editor/components/TemplateImagesEditPanel.js';
import TemplateImagesLibraryPanel from 'editor/components/TemplateImagesLibraryPanel.js';
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';
import makeEditorControlPanel from 'editor/components/panels/utils/makeEditorControlPanel';
import {
    EditorControlPanelHeading
} from 'editor/components/EditorControlHeadings';
import EditorResetConfirmationModal from 'editor/components/EditorResetConfirmationModal';
import {
    useSelectedEditorImageField
} from 'editor/hooks/editorImageField.js';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import makeEditorControlPanelTabs from 'editor/components/EditorControlPanelTabFactory';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';

/* WAYMARK APP DEPENDENCIES */
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';
/* END WAYMARK APP DEPENDENCIES */

const IMAGE_CONTROL_TAB_MODES = [{
        name: 'Library',
        component: TemplateImagesLibraryPanel,
    },
    {
        name: 'Edit',
        component: TemplateImagesEditPanel,
    },
];

const {
    EditorPanelTabButtons,
    useCurrentTab,
    useSetCurrentTab
} =
makeEditorControlPanelTabs(IMAGE_CONTROL_TAB_MODES);

const ResetImageFieldButton = ({
    imageField
}) => {
    // Keep track of whether the image reset modal is open
    const [isResettingImages, setIsResettingImages] = useState(false);

    // Destructuring hook before using so that we can take advantage of eslint rules of hooks
    const {
        useResetToDefaultConfigurationValue
    } = imageField;
    const resetImageField = useResetToDefaultConfigurationValue();

    const setCurrentImageTab = useSetCurrentTab();

    return ( <
        >
        <
        WaymarkButton colorTheme = "BlackText"
        onClick = {
            () => setIsResettingImages(true)
        }
        hasFill = {
            false
        }
        isSmall >
        Use Default <
        /WaymarkButton> <
        EditorResetConfirmationModal bodyText = "Replace this image with the default image."
        editingAttribute = "Image"
        isOpen = {
            isResettingImages
        }
        onClose = {
            () => setIsResettingImages(false)
        }
        onClickReset = {
            () => {
                // Reset the image field to the variant default and close the modal
                resetImageField();
                // Reset to the library panel to ensure our modifications don't get out of whack
                // FIXME: this is kinda a band-aid fix; we should eventually
                // think about aiming for converting our fit/fill and filter controls to respond to
                // external configuration changes
                setCurrentImageTab(IMAGE_CONTROL_TAB_MODES[0]);
            }
        }
        /> <
        />
    );
};
ResetImageFieldButton.propTypes = {
    imageField: editorPropTypes.editorImageField.isRequired,
};

/**
 * Header at top of image control panel with back button and tab button controls
 */
const EditorImageHeader = () => {
    const currentlyEditingImageField = useSelectedEditorImageField();

    return ( <
        >
        <
        HeaderButtonRow >
        <
        BaseHeaderBackButton / > {
            currentlyEditingImageField && ( <
                ResetImageFieldButton imageField = {
                    currentlyEditingImageField
                }
                />
            )
        } <
        /HeaderButtonRow> <
        EditorControlPanelHeading heading = "Images"
        className = {
            css `
          margin-top: 40px;
        `
        }
        /> <
        EditorPanelTabButtons / >
        <
        />
    );
};

const ImageControlsTab = ({
    currentlyEditingImageField,
    scrollEditorPanelToTop
}) => {
    // Destructuring hook before using so that we can take advantage of eslint rules of hooks
    const {
        useCurrentImageURL
    } = currentlyEditingImageField;
    const baseImageFieldURL = useCurrentImageURL(false);

    const {
        name: currentImageTabName,
        component: CurrentImageTabComponent
    } = useCurrentTab();

    const setCurrentImageTab = useSetCurrentTab();

    const onOpenEditTab = () => setCurrentImageTab(IMAGE_CONTROL_TAB_MODES[1]);

    // Make sure that the components are always scrolled to the top.
    useEffect(() => {
        scrollEditorPanelToTop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentImageTabName]);

    return (
        // Apply a fade transition between tabs
        <
        FadeSwitchTransition transitionKey = {
            currentImageTabName
        } >
        <
        CurrentImageTabComponent currentlyEditingImageField = {
            currentlyEditingImageField
        }
        baseImageFieldURL = {
            baseImageFieldURL || ''
        }
        onOpenEditTab = {
            onOpenEditTab
        }
        /> <
        /FadeSwitchTransition>
    );
};
ImageControlsTab.propTypes = {
    currentlyEditingImageField: editorPropTypes.editorImageField.isRequired,
    scrollEditorPanelToTop: PropTypes.func.isRequired,
};

/**
 * Image control panel for editing an image field in the video
 * For now, this allows the user to select images from their library and crop images
 * In the future, the "Editor" tab will allow the user to modify their images in various other
 * ways, and there will be another "Fit and Fill" tab for determining how the image should be sized
 * relative to its container in the video
 */
const EditorImageControls = ({
    scrollEditorPanelToTop
}) => {
    const currentlyEditingImageField = useSelectedEditorImageField();

    return currentlyEditingImageField ? ( <
        ImageControlsTab currentlyEditingImageField = {
            currentlyEditingImageField
        }
        scrollEditorPanelToTop = {
            scrollEditorPanelToTop
        }
        />
    ) : null;
};

EditorImageControls.propTypes = {
    scrollEditorPanelToTop: PropTypes.func.isRequired,
};

/**
 * Constructing and exporting an object that can be consumed by the EditorControlPanel component to render the appropriate
 * components for this editor control panel
 *
 * The output format is an object with the structure:
 * {
 *   Header: HeaderComponent,
 *   Controls: ControlsComponent,
 *   Provider: ProviderComponent (optional)
 * }
 */
export default makeEditorControlPanel(EditorImageHeader, EditorImageControls);