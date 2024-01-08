// Vendor
import _ from 'lodash';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Editor
import EditorFileUploadErrorModal from 'editor/components/EditorFileUploadErrorModal';
import EditorModeButton from 'editor/components/EditorModeButton';
import EditorVideoLibrarySection from 'editor/components/VideoLibrarySection';
import {
    editorPanelKeys
} from 'editor/constants/Editor';
import {
    useEditorMediaLibraries
} from 'editor/providers/EditorMediaLibrariesProvider.js';
import {
    useEditorPanelDispatch
} from 'editor/providers/EditorPanelProvider';
import VideoLibrary from 'app/models/VideoLibrary.js';

// Shared
import ErrorBoundary from 'shared/components/ErrorBoundary';
import breakpoints from 'styles/constants/breakpoints.js';

// Waymark App Dependencies
import {
    SearchIcon
} from 'app/icons/BasicIcons';

/**
 * Renders collapsible sections for editor video libraries.
 */
export default function VideoLibraryPanel({
    librarySections,
    onClickLibraryVideo,
    selectVideoAsset,
    selectedVideoAssetKey,
    configurationVideoUploadKeys,
    removedLibrarySections,
    onAddStockAssetToLibrary,
}) {
    const {
        openControlPanel
    } = useEditorPanelDispatch();

    const {
        video: {
            setUploadErrorMessage,
            uploadErrorMessage
        },
    } = useEditorMediaLibraries();

    return ( <
        div className = {
            css `
        margin-bottom: 72px;
      `
        } >
        <
        div className = {
            css `
          padding-bottom: 4px;
          margin-bottom: 28px;
        `
        } >
        <
        EditorModeButton onClick = {
            () => {
                openControlPanel(editorPanelKeys.stockVideoSearch, {
                    onAddStockAssetToLibrary,
                });
            }
        }
        analyticsAction = "selected_search_stock_videos"
        primaryText = "Search stock clips"
        subText = "powered by Shutterstock"
        icon = { < SearchIcon / >
        }
        /> <
        /div> <
        ErrorBoundary containerClass = {
            css `
          height: calc(100vh - 600px);

          @media ${breakpoints.small.queryDown} {
            height: calc(100vh - 500px);
          }
        `
        } >
        {
            librarySections.map((librarySection) => ( <
                EditorVideoLibrarySection key = {
                    librarySection.slug
                }
                library = {
                    librarySection
                }
                onClickLibraryVideo = {
                    onClickLibraryVideo
                }
                selectVideoAsset = {
                    selectVideoAsset
                }
                selectedVideoAssetKey = {
                    selectedVideoAssetKey
                }
                configurationVideoUploadKeys = {
                    configurationVideoUploadKeys
                }
                />
            ))
        }

        {
            !_.isEmpty(removedLibrarySections) ? ( <
                EditorModeButton onClick = {
                    () =>
                    openControlPanel(editorPanelKeys.restoreRemovedVideos, {
                        removedLibrarySections,
                    })
                }
                analyticsAction = "selected_restore_removed_videos"
                primaryText = "Deleted videos"
                subText = "View and restore deleted videos"
                className = {
                    css `
              margin: 24px auto 0;
            `
                }
                />
            ) : null
        }

        <
        EditorFileUploadErrorModal title = "Sorry!"
        errorMessage = {
            uploadErrorMessage
        }
        isVisible = {
            Boolean(uploadErrorMessage)
        }
        onCloseModal = {
            () => setUploadErrorMessage('')
        }
        /> <
        /ErrorBoundary> <
        /div>
    );
}

VideoLibraryPanel.propTypes = {
    librarySections: PropTypes.arrayOf(PropTypes.instanceOf(VideoLibrary)),
    onClickLibraryVideo: PropTypes.func,
    selectVideoAsset: PropTypes.func,
    selectedVideoAssetKey: PropTypes.string,
    configurationVideoUploadKeys: PropTypes.arrayOf(PropTypes.string),
    removedLibrarySections: PropTypes.arrayOf(PropTypes.instanceOf(VideoLibrary)),
    onAddStockAssetToLibrary: PropTypes.func,
};
VideoLibraryPanel.defaultProps = {
    librarySections: [],
    onClickLibraryVideo: null,
    selectVideoAsset: null,
    selectedVideoAssetKey: null,
    configurationVideoUploadKeys: [],
    removedLibrarySections: [],
    onAddStockAssetToLibrary: () => {},
};