// Vendor
import {
    useState,
    useEffect,
    useRef
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Editor
import HeaderButtonRow from 'editor/components/EditorControlPanelHeaderButtonRow.js';
import BaseHeaderBackButton from 'editor/components/BaseHeaderBackButton';
import {
    EditorControlPanelHeading
} from 'editor/components/EditorControlHeadings';
import EditorResetConfirmationModal from 'editor/components/EditorResetConfirmationModal';
import makeEditorControlPanelTabs from 'editor/components/EditorControlPanelTabFactory';
import EditorVideoLibrary from 'editor/components/EditorVideoLibrary.js';
import EditorVideoEditTab from 'editor/components/EditorVideoEditTab.js';
import {
    useSelectedEditorVideoField
} from 'editor/hooks/editorVideoField.js';
import makeEditorControlPanel from 'editor/components/panels/utils/makeEditorControlPanel';
import editorPropTypes from 'editor/constants/editorPropTypes.js';

// Shared
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import {
    useRendererFramerate
} from 'shared/web_video/providers/VideoTemplateConfiguratorProvider';

/* WAYMARK APP DEPENDENCIES */
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';
/* END WAYMARK APP DEPENDENCIES */

const VIDEO_CONTROL_TAB_MODES = [{
        name: 'Library',
        component: EditorVideoLibrary,
    },
    {
        name: 'Edit',
        component: EditorVideoEditTab,
    },
];

const {
    EditorPanelTabButtons,
    useCurrentTab,
    useSetCurrentTab
} =
makeEditorControlPanelTabs(VIDEO_CONTROL_TAB_MODES);

const ResetVideoFieldButton = ({
    videoField
}) => {
    // Keep track of whether the video reset modal is open
    const [isResettingVideo, setIsResettingVideo] = useState(false);

    // Destructuring hook before using so that we can take advantage of eslint rules of hooks
    const {
        useResetToDefaultConfigurationValue
    } = videoField;
    const resetVideoField = useResetToDefaultConfigurationValue();

    return ( <
        >
        <
        WaymarkButton colorTheme = "BlackText"
        onClick = {
            () => setIsResettingVideo(true)
        }
        hasFill = {
            false
        }
        isSmall >
        Use Default <
        /WaymarkButton> <
        EditorResetConfirmationModal bodyText = "Replace this video with the default video?"
        isOpen = {
            isResettingVideo
        }
        onClose = {
            () => setIsResettingVideo(false)
        }
        onClickReset = {
            () => {
                // Reset the video field to the variant default and close the modal
                resetVideoField();
            }
        }
        /> <
        />
    );
};
ResetVideoFieldButton.propTypes = {
    videoField: editorPropTypes.editorVideoField.isRequired,
};

/**
 * Header at top of video control panel with back button and tab button controls
 */
const EditorVideoHeader = () => {
    const videoFieldPlaybackDuration = useRef(0);

    const currentlyEditingVideoField = useSelectedEditorVideoField();
    const videoFramerate = useRendererFramerate();

    // As this component unmounts, currentlyEditingVideoField is null because the panel context has
    // been reset, which means we no longer have access to the inPoint and outPoint.
    // Since the playback duration is not something that will change during an editing session, we're
    // storing the value as a ref and returning that if currentlyEditingVideoField is null to avoid
    // any white screens or changes to the subheading text.
    if (currentlyEditingVideoField) {
        videoFieldPlaybackDuration.current = Math.round(
            (currentlyEditingVideoField.outPoint - currentlyEditingVideoField.inPoint) / videoFramerate,
        );
    }

    return ( <
        >
        <
        HeaderButtonRow >
        <
        BaseHeaderBackButton / > {
            currentlyEditingVideoField && ( <
                ResetVideoFieldButton videoField = {
                    currentlyEditingVideoField
                }
                />
            )
        } <
        /HeaderButtonRow> <
        EditorControlPanelHeading heading = "Video"
        subheading = {
            `Choose a video that's at least ${videoFieldPlaybackDuration.current} seconds.`
        }
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

const VideoControlsTab = ({
    currentlyEditingVideoField,
    scrollEditorPanelToTop
}) => {
    const {
        name: currentTabName,
        component: CurrentTabComponent
    } = useCurrentTab();

    const setCurrentTab = useSetCurrentTab();

    const onOpenEditTab = () => setCurrentTab(VIDEO_CONTROL_TAB_MODES[1]);

    // Make sure that the components are always scrolled to the top.
    useEffect(() => {
        scrollEditorPanelToTop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTabName]);

    return (
        // Apply a fade transition between tabs
        <
        FadeSwitchTransition transitionKey = {
            currentTabName
        } > {
            currentlyEditingVideoField && ( <
                CurrentTabComponent currentlyEditingVideoField = {
                    currentlyEditingVideoField
                }
                onOpenEditTab = {
                    onOpenEditTab
                }
                />
            )
        } <
        /FadeSwitchTransition>
    );
};
VideoControlsTab.propTypes = {
    currentlyEditingVideoField: editorPropTypes.editorVideoField.isRequired,
    scrollEditorPanelToTop: PropTypes.func.isRequired,
};

/**
 * Video control panel for editing a video field in the video
 * This allows the user to select video clips from their library, trim a clip to fit into the video, and make audio adjustments to the clip
 */
const EditorVideoControls = ({
    scrollEditorPanelToTop
}) => {
    const currentlyEditingVideoField = useSelectedEditorVideoField();

    return currentlyEditingVideoField ? ( <
        VideoControlsTab currentlyEditingVideoField = {
            currentlyEditingVideoField
        }
        scrollEditorPanelToTop = {
            scrollEditorPanelToTop
        }
        />
    ) : null;
};

EditorVideoControls.propTypes = {
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
export default makeEditorControlPanel(EditorVideoHeader, EditorVideoControls);