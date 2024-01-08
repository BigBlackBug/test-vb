// Vendor
import _ from 'lodash';
import PropTypes from 'prop-types';

// Editor
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';
import {
    EditorControlPanelHeading
} from 'editor/components/EditorControlHeadings';
import makeEditorControlPanel from 'editor/components/panels/utils/makeEditorControlPanel';
import RemovedAssetLibrarySection from 'editor/components/RemovedAssetLibrarySection';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import {
    useEditorMediaLibraries
} from 'editor/providers/EditorMediaLibrariesProvider.js';

const RestorationControlsHeader = () => < BaseHeaderBackButton / > ;

/**
 * Renders the RemovedAssetLibrarySection for an image library's removed assets, or nothing if the library
 * doesn't have any removed assets.
 *
 * @param {BaseImageLibrary}  imageLibrary  An image library which we'll display a section for with its removed assets
 * @param {bool} isInitiallyExpanded  Whether this library section should be expanded by default
 */
const RemovedImageLibrarySection = ({
    imageLibrary,
    isInitiallyExpanded
}) => {
    const removedLibraryImages = imageLibrary.removedAssets;

    if (_.isEmpty(removedLibraryImages)) {
        // Don't display a section if it doesn't have any removed images in it
        return null;
    }

    return ( <
        RemovedAssetLibrarySection displayName = {
            imageLibrary.displayName
        }
        assets = {
            removedLibraryImages
        }
        isInitiallyExpanded = {
            isInitiallyExpanded
        }
        restoreAsset = {
            (assetToRestore) => imageLibrary.restoreRemovedImage(assetToRestore)
        }
        />
    );
};
RemovedImageLibrarySection.propTypes = {
    imageLibrary: editorPropTypes.imageLibrary.isRequired,
    isInitiallyExpanded: PropTypes.bool,
};
RemovedImageLibrarySection.defaultProps = {
    isInitiallyExpanded: false,
};

/**
 * Provides list of removed images that the user can restore to their library
 */
const ImageRestorationControls = ({
    sharedPanelContext
}) => {
    const {
        isBusinessProfilePanel
    } = sharedPanelContext;

    const {
        image: {
            editingBusinessImageLibraries,
            appliedBusinessImageLibraries,
            accountImageLibraries
        },
    } = useEditorMediaLibraries();

    const displayLibraries = isBusinessProfilePanel ? // If this is the restoration panel for the business profile panel, we'll only show the
        // removed images from the editing business' image libraries
        editingBusinessImageLibraries : // Otherwise, this is the main restoration panel, so we'll show removed images for
        // the applied business' image libraries as well as any account image libraries
        [...appliedBusinessImageLibraries, ...accountImageLibraries];

    return ( <
        >
        <
        EditorControlPanelHeading heading = "Deleted Images"
        subheading = "Select an image you'd like to restore." /
        >
        <
        div > {
            displayLibraries.map((imageLibrary, index) => ( <
                RemovedImageLibrarySection key = {
                    imageLibrary.key
                }
                imageLibrary = {
                    imageLibrary
                }
                // Only the first library is initially expanded
                isInitiallyExpanded = {
                    index === 0
                }
                />
            ))
        } <
        /div> <
        />
    );
};
ImageRestorationControls.propTypes = {
    sharedPanelContext: PropTypes.shape({
        isBusinessProfilePanel: PropTypes.bool.isRequired,
    }).isRequired,
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
export default makeEditorControlPanel(RestorationControlsHeader, ImageRestorationControls);