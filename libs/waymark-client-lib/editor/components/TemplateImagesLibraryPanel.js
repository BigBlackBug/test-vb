// Vendor
import _ from 'lodash';
import {
    useCallback,
    useEffect,
    useMemo
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Editor
import {
    useEditorMediaLibraries
} from 'editor/providers/EditorMediaLibrariesProvider.js';
import {
    useAllEditorImageFieldURLs
} from 'editor/hooks/editorImageField.js';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import ImageLibraryPanel from 'editor/components/ImageLibraryPanel';
import EditorModeButton from 'editor/components/EditorModeButton';
import {
    useEditorPanelDispatch
} from 'editor/providers/EditorPanelProvider';
import {
    editorPanelKeys
} from 'editor/constants/Editor';

// Shared
import {
    useJumpVideoToTime
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';

// Waymark App Dependencies
import {
    SearchIcon
} from 'app/icons/BasicIcons';

/**
 * Displays all of the user's available image libraries and photos
 */
const TemplateImagesLibraryPanel = ({
    currentlyEditingImageField,
    onOpenEditTab,
    baseImageFieldURL,
}) => {
    const {
        image: {
            onOpenTemplateImagesPanel,
            appliedBusinessImageLibraries,
            accountImageLibraries,
            staticImageLibraries,
        },
    } = useEditorMediaLibraries();

    useEffect(() => {
        onOpenTemplateImagesPanel();
    }, [onOpenTemplateImagesPanel]);

    const {
        openControlPanel
    } = useEditorPanelDispatch();

    const {
        displayTime,
        // Destructuring hook before using so that we can take advantage of eslint rules of hooks
        useSetImageURL,
    } = currentlyEditingImageField;
    const setImageURL = useSetImageURL();

    // Get urls for all image fields
    const currentTemplateImageURLs = useAllEditorImageFieldURLs(false);
    const jumpVideoToTime = useJumpVideoToTime();

    // Select a new image URL to use for the focused image field
    const selectLibraryImage = useCallback(
        (imageURL) => {
            // Jump to the time in the video where the field we're editing is visible
            if (displayTime != null) {
                jumpVideoToTime(displayTime);
            }

            // Update the currently selected image field with the new image url
            setImageURL(imageURL);
        }, [displayTime, jumpVideoToTime, setImageURL],
    );

    // Construct a combined list of image libraries which we want to display in the UI
    const combinedImageLibrariesToDisplay = useMemo(() => {
        const imageLibraries = [];

        if (!_.isEmpty(appliedBusinessImageLibraries)) {
            imageLibraries.push(...appliedBusinessImageLibraries);

            if (!_.isEmpty(accountImageLibraries)) {
                // If we have business libraries, only include non-placeholder account libraries
                imageLibraries.push(...accountImageLibraries.filter((library) => !library.isPlaceholder));
            }
        } else {
            // If we don't have business libraries, include all account libraries, including placeholders
            imageLibraries.push(...accountImageLibraries);
        }

        imageLibraries.push(...staticImageLibraries);

        return imageLibraries;
    }, [appliedBusinessImageLibraries, accountImageLibraries, staticImageLibraries]);

    return ( <
        >
        <
        div className = {
            css `
          padding-bottom: 4px;
          margin-bottom: 28px;
        `
        } >
        <
        EditorModeButton onClick = {
            () => openControlPanel(editorPanelKeys.stockImageSearch)
        }
        analyticsAction = "selected_stock_image_search"
        primaryText = "Search for Stock Photos"
        subText = "powered by Shutterstock"
        icon = { < SearchIcon / >
        }
        /> <
        /div> <
        ImageLibraryPanel imageLibraries = {
            combinedImageLibrariesToDisplay
        }
        onUploadLibraryImages = {
            (uploadedImages) => {
                if (uploadedImages.length === 1) {
                    selectLibraryImage(uploadedImages[0].baseUrl);
                }
            }
        }
        currentTemplateImageURLs = {
            currentTemplateImageURLs
        }
        baseImageFieldURL = {
            baseImageFieldURL
        }
        onClickLibraryImage = {
            (imageAsset) => {
                if (imageAsset.isSelected) {
                    // If this image is already selected, open the "Edit" tab when the user clicks on it
                    onOpenEditTab();
                } else {
                    // Otherwise, select the image
                    selectLibraryImage(imageAsset.imageURL);
                }
            }
        }
        /> <
        />
    );
};
TemplateImagesLibraryPanel.propTypes = {
    currentlyEditingImageField: editorPropTypes.editorImageField.isRequired,
    baseImageFieldURL: PropTypes.string.isRequired,
    onOpenEditTab: PropTypes.func.isRequired,
};

export default TemplateImagesLibraryPanel;