// Vendor
import {
    useLayoutEffect,
    useRef
} from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

// Local
import EditorControls from 'editor/components/EditorControls';
import EditorPanelProvider from 'editor/providers/EditorPanelProvider';
import EditorMediaLibrariesProvider from 'editor/providers/EditorMediaLibrariesProvider.js';
import EditorFormDescriptionProvider from 'editor/providers/EditorFormDescriptionProvider.js';
import EditorLongPressModalProvider from 'editor/providers/EditorLongPressModalProvider.js';
import EditorAudioControlsProvider from 'editor/providers/EditorAudioControlsProvider.js';

import EditorStateProvider, {
    useEditorDispatch,
    useEditorState,
} from 'editor/providers/EditorStateProvider.js';
import EditorVideoProvider, {
    useEditorVideoContext,
} from 'editor/providers/EditorVideoProvider.js';
import EditorUnsavedChangesBlocker from 'editor/components/EditorUnsavedChangesBlocker.js';

import editorPropTypes from 'editor/constants/editorPropTypes.js';

// Shared
import ErrorBoundary from 'shared/components/ErrorBoundary';
import {
    VideoTemplateConfiguratorProvider
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';
import sharedPropTypes from 'shared/components/propTypes/index.js';
import VideoPlayer from 'shared/web_video/components/VideoPlayer';

/* WAYMARK APP DEPENDENCIES */
import {
    useVideoPlayerDimensions
} from 'app/hooks/videoPlayer';
import {
    useAppThemeConfig
} from 'app/state/appThemeStore/appThemeStore';
import {
    coreBusinessDetailsPropType
} from 'shared/api/graphql/businesses/fragments';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './Editor.css';

const VIDEO_SECTION_PADDING_WIDTH = styles.videoSectionPadding;

/**
 * This is the page entrypoint for editing a video
 *
 * @param {object}  editorMediaLibraries    Media libraries containing the colors, fonts, images, etc tied to the user's account
 *                                          which we will pass into the EditorMediaLibraryProvider
 * @param {bool}    isMobile                Whether we should show the mobile or desktop versions of the editor UI
 * @param {number}  bannerElementHeight     Height of the banner element at the top of the page which we should account for in the
 *                                          editor's height, if applicable
 * @param {object}  [studioPreviewOverrides]  Object with override values for the form description, editing actions, and project manifest
 *                                              to use in the editor if this is a studio publish preview
 */
function Editor({
    editorMediaLibraries,
    isMobile,
    bannerElementHeight,
    studioPreviewOverrides = null,
}) {
    const videoPlayerSectionRef = useRef();

    const {
        editorVariant,
        isEditableTemplate
    } = useEditorVideoContext();
    const {
        setVideoDescriptor
    } = useEditorDispatch();
    const {
        videoDescriptor
    } = useEditorState();

    const {
        aspectRatio
    } = editorVariant;
    // Keep track of the width and height that the video player should be displayed at
    const playerDimensions = useVideoPlayerDimensions(aspectRatio, videoPlayerSectionRef);

    const appThemeConfig = useAppThemeConfig();

    useLayoutEffect(() => {
        // Apply a special class to the root <html> element to apply some special editor-specific styles
        // that need to be set on the <html> and <body> elements
        document.documentElement.classList.add(styles.EditPageRoot);
        return () => {
            document.documentElement.classList.remove(styles.EditPageRoot);
        };
    }, []);

    return ( <
        main className = {
            styles.EditPage
        }
        // On desktop, if an active banner is present reduce the page contents' height so the banner won't
        // overlap with the other contents or cause the contents to overflow off the page
        style = {
            {
                height: isMobile ? '100%' : `calc(100% - ${bannerElementHeight}px)`
            }
        } >
        <
        section { ...styles.dataEditorOrientation(
                appThemeConfig.editor.orientation || styles.editorOrientation.right,
            )
        }
        className = {
            styles.EditPageContent
        }
        data - testid = "editPageContent" >
        <
        VideoTemplateConfiguratorProvider videoDescriptor = {
            videoDescriptor
        }
        studioPreviewOverrides = {
            studioPreviewOverrides
        }
        onConfiguratorChangeApplied = {
            (configurator) => {
                setVideoDescriptor((current) => ({
                    ...current,
                    projectManifest: _.cloneDeep(configurator.renderer.videoData),
                }));
            }
        } >
        <
        div className = {
            styles.EditPageVideoSection
        }
        style = {
            {
                // On mobile, if an active banner is present add its height to the video section's
                // padding so the video player doesn't get covered by the banner
                paddingTop: isMobile ?
                    bannerElementHeight + VIDEO_SECTION_PADDING_WIDTH :
                    VIDEO_SECTION_PADDING_WIDTH,
            }
        }
        id = "wm-editor-video-section"
        ref = {
            videoPlayerSectionRef
        } >
        {!isEditableTemplate ? ( <
                div className = {
                    styles.UnsupportedTemplateMessage
                } >
                Sorry, it looks like you & apos; re using a template that no longer supports editing and previewing.You can still purchase and download your video
                if you need access to it. <
                /div>
            ) : ( <
                div style = {
                    {
                        width: playerDimensions.width,
                        height: playerDimensions.height,
                    }
                } >
                <
                ErrorBoundary >
                <
                VideoPlayer / >
                <
                /ErrorBoundary> <
                /div>
            )
        } <
        /div>

        <
        EditorAudioControlsProvider >
        <
        EditorFormDescriptionProvider overrideFormDescription = {
            studioPreviewOverrides ? studioPreviewOverrides.formDescription : null
        }
        overrideTemplateManifest = {
            studioPreviewOverrides ? studioPreviewOverrides.templateManifest : null
        } >
        <
        EditorMediaLibrariesProvider editorMediaLibraries = {
            editorMediaLibraries
        } >
        <
        EditorLongPressModalProvider >
        <
        EditorPanelProvider >
        <
        EditorControls videoSectionHeight = {
            playerDimensions.height +
            bannerElementHeight +
            VIDEO_SECTION_PADDING_WIDTH * 2
        }
        isMobile = {
            isMobile
        }
        /> <
        EditorUnsavedChangesBlocker / >
        <
        /EditorPanelProvider> <
        /EditorLongPressModalProvider> <
        /EditorMediaLibrariesProvider> <
        /EditorFormDescriptionProvider> <
        /EditorAudioControlsProvider> <
        /VideoTemplateConfiguratorProvider> <
        /section> <
        /main>
    );
}
Editor.propTypes = {
    editorMediaLibraries: editorPropTypes.editorMediaLibraries.isRequired,
    isMobile: PropTypes.bool.isRequired,
    bannerElementHeight: PropTypes.number.isRequired,
    studioPreviewOverrides: sharedPropTypes.studioPreviewOverrides,
};

export default function EditorWithProviders({
    editorVariant,
    editorUserVideo = null,
    accountName = '',
    allBusinessesForAccount,
    isLoadingAllBusinesses,
    refetchBusinessesForAccount,
    appliedBusinessGUID = null,
    setAppliedBusinessGUID,
    appliedBusinessDetails = null,
    isAppliedBusinessLoading,
    editingBusinessGUID = null,
    setEditingBusinessGUID,
    editingBusinessDetails = null,
    isEditingBusinessLoading,
    isUserLoggedIn,
    createOrUpdateSavedDraft,
    openUserVideoInEditor,
    editorMediaLibraries,
    isMobile = false,
    bannerElementHeight = 0,
    studioPreviewOverrides = null,
}) {
    return ( <
        EditorVideoProvider editorVariant = {
            editorVariant
        }
        editorUserVideo = {
            editorUserVideo
        } >
        <
        EditorStateProvider createOrUpdateSavedDraft = {
            createOrUpdateSavedDraft
        }
        openUserVideoInEditor = {
            openUserVideoInEditor
        }
        isUserLoggedIn = {
            isUserLoggedIn
        }
        accountName = {
            accountName
        }
        allBusinessesForAccount = {
            allBusinessesForAccount
        }
        isLoadingAllBusinesses = {
            isLoadingAllBusinesses
        }
        refetchBusinessesForAccount = {
            refetchBusinessesForAccount
        }
        appliedBusinessGUID = {
            appliedBusinessGUID
        }
        setAppliedBusinessGUID = {
            setAppliedBusinessGUID
        }
        appliedBusinessDetails = {
            appliedBusinessDetails
        }
        isAppliedBusinessLoading = {
            isAppliedBusinessLoading
        }
        editingBusinessGUID = {
            editingBusinessGUID
        }
        setEditingBusinessGUID = {
            setEditingBusinessGUID
        }
        editingBusinessDetails = {
            editingBusinessDetails
        }
        isEditingBusinessLoading = {
            isEditingBusinessLoading
        } >
        <
        Editor editorMediaLibraries = {
            editorMediaLibraries
        }
        isMobile = {
            isMobile
        }
        bannerElementHeight = {
            bannerElementHeight
        }
        studioPreviewOverrides = {
            studioPreviewOverrides
        }
        /> <
        /EditorStateProvider> <
        /EditorVideoProvider>
    );
}
EditorWithProviders.propTypes = {
    editorVariant: editorPropTypes.editorVariant.isRequired,
    editorUserVideo: editorPropTypes.editorUserVideo,
    appliedBusinessGUID: PropTypes.string,
    setAppliedBusinessGUID: PropTypes.func.isRequired,
    appliedBusinessDetails: coreBusinessDetailsPropType,
    isAppliedBusinessLoading: PropTypes.bool.isRequired,
    editingBusinessGUID: PropTypes.string,
    setEditingBusinessGUID: PropTypes.func.isRequired,
    editingBusinessDetails: coreBusinessDetailsPropType,
    isEditingBusinessLoading: PropTypes.bool.isRequired,
    accountName: PropTypes.string,
    isUserLoggedIn: PropTypes.bool.isRequired,
    createOrUpdateSavedDraft: PropTypes.func.isRequired,
    openUserVideoInEditor: PropTypes.func.isRequired,
    editorMediaLibraries: editorPropTypes.editorMediaLibraries.isRequired,
    isMobile: PropTypes.bool,
    bannerElementHeight: PropTypes.number,
    studioPreviewOverrides: sharedPropTypes.studioPreviewOverrides,
    allBusinessesForAccount: PropTypes.arrayOf(coreBusinessDetailsPropType).isRequired,
    isLoadingAllBusinesses: PropTypes.bool.isRequired,
    refetchBusinessesForAccount: PropTypes.func.isRequired,
};