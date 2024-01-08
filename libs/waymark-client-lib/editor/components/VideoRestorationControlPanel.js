// Vendor
import {
    useMemo
} from 'react';
import PropTypes from 'prop-types';

// Editor
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';
import {
    EditorControlPanelHeading
} from 'editor/components/EditorControlHeadings';
import {
    useEditorMediaLibraries
} from 'editor/providers/EditorMediaLibrariesProvider.js';
import makeEditorControlPanel from 'editor/components/panels/utils/makeEditorControlPanel';
import RemovedAssetLibrarySection from 'editor/components/RemovedAssetLibrarySection';
import {
    configureVideoLibrarySections
} from 'editor/utils/videoLibraries.js';
import {
    assetOwnerTypes
} from 'editor/constants/mediaLibraries.js';

const RestorationControlsHeader = () => < BaseHeaderBackButton / > ;

/**
 * Provides list of removed videos that the user can restore to their library
 */
const VideoRestorationControls = ({
    sharedPanelContext
}) => {
    const {
        removedLibrarySections
    } = sharedPanelContext;

    const {
        video: {
            videoAssets,
            refreshBusinessVideoCountQuery
        },
    } = useEditorMediaLibraries();

    const removedVideoLibrarySections = useMemo(
        () =>
        configureVideoLibrarySections(
            videoAssets,
            removedLibrarySections.map((section) => ({
                ...section,
                shouldDisplayEmpty: false,
                canUpload: false,
            })),
            true, // isRemoved
        ), [removedLibrarySections, videoAssets],
    );

    return ( <
        >
        <
        EditorControlPanelHeading heading = "Deleted Videos"
        subheading = "Select a video you'd like to restore." /
        > {
            removedVideoLibrarySections.map((removedLibrarySection) => ( <
                RemovedAssetLibrarySection key = {
                    removedLibrarySection.slug
                }
                displayName = {
                    removedLibrarySection.displayName
                }
                assets = {
                    removedLibrarySection.videoAssets
                }
                isInitiallyExpanded = {
                    removedLibrarySection.isInitiallyExpanded
                }
                restoreAsset = {
                    (asset) =>
                    asset.restore(
                        asset.owner === assetOwnerTypes.business ? refreshBusinessVideoCountQuery : null,
                    )
                }
                />
            ))
        } <
        />
    );
};
VideoRestorationControls.propTypes = {
    sharedPanelContext: PropTypes.shape({
        // eslint-disable-next-line react/forbid-prop-types
        removedLibrarySections: PropTypes.arrayOf(PropTypes.object),
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
export default makeEditorControlPanel(RestorationControlsHeader, VideoRestorationControls);