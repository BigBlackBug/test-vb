// Vendor
import _ from 'lodash';
import {
    useEffect,
    useRef,
    useState
} from 'react';
import {
    css
} from '@emotion/css';

// Editor
import {
    EditorControlSectionHeading
} from 'editor/components/EditorControlHeadings';
import EditorVideoFitModeSelector from 'editor/components/EditorVideoFitModeSelector.js';
import EditorVideoPreview from 'editor/components/EditorVideoPreview.js';
import EditorVideoTrimControls from 'editor/components/EditorVideoTrimControls.js';
import EditorVideoAudioAdjustControls from 'editor/components/EditorVideoAudioAdjustControls.js';
import EditorVideoFitAndFillControls from 'editor/components/EditorVideoFitAndFillControls.js';
import EditorVideoFitFillOverlayControls from 'editor/components/EditorVideoFitFillOverlayControls.js';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import {
    fitFillModes,
    modificationConfigurationPaths,
    defaultFitFillMode,
    defaultFitFillModeModifications,
} from 'editor/constants/EditorVideo.js';

// Shared
import ErrorBoundary from 'shared/components/ErrorBoundary';
import {
    RotatingLoader
} from '@libs/shared-ui-components';
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';
import breakpoints from 'styles/constants/breakpoints.js';

/**
 * Hook sanitizes the configuration values for a given video field and returns a boolean indicating whether it has been sanitized
 *
 * @param {EditorVideoField} videoField
 */
const useSanitizeVideoFieldConfiguration = (videoField) => {
    const {
        useUpdateVideoConfigurationValue
    } = videoField;
    const updateVideoConfigurationValue = useUpdateVideoConfigurationValue();

    // Sanitize the configuration's modifications before the user starts editing the video
    const [hasConfigurationBeenSanitized, setHasConfigurationBeenSanitized] = useState(false);

    useEffect(() => {
        // Clean up and fill in any missing or legacy values in the video's configuration
        updateVideoConfigurationValue((currentConfigurationValue) => {
            // Get the selected fit mode from the configuration value
            let selectedFitMode = currentConfigurationValue[modificationConfigurationPaths.fit];

            // If we don't have a fit modification set, fill it in
            if (!selectedFitMode) {
                // Check if the configuration has a legacy value at "content.modifications.fit" when we are now storing this value on "contentFit"
                const legacyFitValue = _.get(
                    currentConfigurationValue,
                    modificationConfigurationPaths.legacy.fit,
                );

                // If we have a legacy value, migrate it to the new path, otherwise default
                // to the default fit mode
                selectedFitMode = legacyFitValue || defaultFitFillMode;
            }

            // Clone the current configuration value and fill in any default modifications that may be missing for the selected fit mode
            const newConfigurationValue = {
                ...defaultFitFillModeModifications[selectedFitMode],
                ...currentConfigurationValue,
            };

            if (selectedFitMode === fitFillModes.fitVideo) {
                // If the configuration value has a background fill set at the legacy "content.modifications.backgroundFill" path,
                // ensure we migrate that over to the new "contentBackgroundFill" path
                const legacyBackgroundFill = _.get(
                    newConfigurationValue,
                    modificationConfigurationPaths.legacy.backgroundFill,
                );

                if (legacyBackgroundFill) {
                    newConfigurationValue[modificationConfigurationPaths.backgroundFill] =
                        legacyBackgroundFill;
                }
            }

            // If the configuration value has a legacy modifications object on it, delete it
            if (newConfigurationValue.content.modifications) {
                delete newConfigurationValue.content.modifications;
            }

            return newConfigurationValue;
        });

        // The configuration has now been sanitized and can be safely interacted with!
        setHasConfigurationBeenSanitized(true);
    }, [updateVideoConfigurationValue]);

    return hasConfigurationBeenSanitized;
};

/**
 * Renders trim and audio adjust controls for editing the video field's currently selected asset
 *
 * @param {EditorVideoField}  currentlyEditingVideoField
 */
export default function EditorVideoEditTab({
    currentlyEditingVideoField
}) {
    const isFieldSanitized = useSanitizeVideoFieldConfiguration(currentlyEditingVideoField);

    const videoElementRef = useRef();

    const {
        useCurrentVideoAssetProcessedOutput,
        useCurrentVideoAssetMetadata,
        useCurrentConfigurationValue,
        useUpdateVideoConfigurationValue,
        useUpdateVideoModification,
    } = currentlyEditingVideoField;

    const currentConfigurationValue = useCurrentConfigurationValue();
    const updateVideoConfigurationValue = useUpdateVideoConfigurationValue();
    const updateVideoModification = useUpdateVideoModification();

    const selectedFitMode = _.get(
        currentConfigurationValue,
        modificationConfigurationPaths.fit,
        defaultFitFillMode,
    );

    const [thumbnailImages, [h264VideoSrc]] = useCurrentVideoAssetProcessedOutput([
        'tenThumbnails_jpg300',
        'webPlayer_h264',
    ]);
    const videoAssetMetadata = useCurrentVideoAssetMetadata();

    // Don't display trim controls until we've loaded the asset's metadata
    const isVideoMetadataLoaded = Boolean(videoAssetMetadata ? .width);

    const canDisplayTabContents = isFieldSanitized && isVideoMetadataLoaded;

    return ( <
        ErrorBoundary containerClass = {
            css `
        height: calc(100vh - 600px);

        @media ${breakpoints.small.queryDown} {
          height: calc(100vh - 500px);
        }
      `
        } >
        <
        EditorControlSectionHeading heading = "Trim, Fit & Fill"
        className = {
            css `
          margin-bottom: 16px;
        `
        }
        /> <
        FadeSwitchTransition
        // Trigger a fade transition when the editor finishes setting up
        transitionKey = {
            canDisplayTabContents ? 'display' : 'hide'
        } >
        {
            canDisplayTabContents ? ( <
                >
                <
                EditorVideoFitModeSelector selectedFitMode = {
                    selectedFitMode
                }
                updateVideoConfigurationValue = {
                    updateVideoConfigurationValue
                }
                /> <
                EditorVideoPreview ref = {
                    videoElementRef
                }
                videoAssetMetadata = {
                    videoAssetMetadata
                }
                videoSrc = {
                    h264VideoSrc
                }
                // Display a poster of the first frame while the video is still loading (this is primarily only needed for iOS, where videos don't even preload and display
                // the first frame of the video until it receives a user interaction to start playing)
                posterSrc = {
                    thumbnailImages[0]
                }
                overlay = { <
                    EditorVideoFitFillOverlayControls
                    currentConfigurationValue = {
                        currentConfigurationValue
                    }
                    currentlyEditingVideoField = {
                        currentlyEditingVideoField
                    }
                    />
                }
                currentConfigurationValue = {
                    currentConfigurationValue
                }
                /> <
                EditorVideoTrimControls currentlyEditingVideoField = {
                    currentlyEditingVideoField
                }
                videoAssetMetadata = {
                    videoAssetMetadata
                }
                currentConfigurationValue = {
                    currentConfigurationValue
                }
                updateVideoConfigurationValue = {
                    updateVideoConfigurationValue
                }
                videoElementRef = {
                    videoElementRef
                }
                /> <
                EditorVideoFitAndFillControls currentConfigurationValue = {
                    currentConfigurationValue
                }
                updateVideoModification = {
                    updateVideoModification
                }
                selectedFitMode = {
                    selectedFitMode
                }
                /> <
                EditorVideoAudioAdjustControls currentlyEditingVideoField = {
                    currentlyEditingVideoField
                }
                currentConfigurationValue = {
                    currentConfigurationValue
                }
                updateVideoConfigurationValue = {
                    updateVideoConfigurationValue
                }
                /> <
                />
            ) : (
                // If the editor hasn't been set up yet, show a loading spinner
                <
                div >
                <
                p >
                This clip is processing before it can be edited.It can take up to two minutes to be ready. <
                /p> <
                RotatingLoader className = {
                    css `
                display: block !important;
                margin: 72px auto;
              `
                }
                /> <
                /div>
            )
        } <
        /FadeSwitchTransition> <
        /ErrorBoundary>
    );
}
EditorVideoEditTab.propTypes = {
    currentlyEditingVideoField: editorPropTypes.editorVideoField.isRequired,
};