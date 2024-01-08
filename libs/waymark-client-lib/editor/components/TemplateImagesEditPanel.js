// Vendor
import {
    useEffect,
    useState
} from 'react';
import PropTypes from 'prop-types';

// Editor
import EditorImageFitAndFillControls from 'editor/components/EditorImageFitAndFillControls.js';
import EditorImageFilterControls from 'editor/components/EditorImageFilterControls.js';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import UpscaleLibraryImageToggle from 'editor/components/UpscaleLibraryImageToggle';
import {
    useEditorMediaLibraries
} from 'editor/providers/EditorMediaLibrariesProvider.js';

// Shared
import ErrorBoundary from 'shared/components/ErrorBoundary';
import {
    RotatingLoader
} from '@libs/shared-ui-components';
import CrossFadeTransition from 'shared/components/CrossFadeTransition.js';
import * as styles from './TemplateImagesEditPanel.css';

/**
 * Renders fit/fill and filter controls for editing the image field's currently selected image asset
 *
 * @param {EditorImageField}  currentlyEditingImageField
 * @param {string}  baseImageFieldURL   The base sanitized url representing the currently selected image asset
 */
export default function TemplateImagesEditPanel({
    currentlyEditingImageField,
    baseImageFieldURL
}) {
    const [isUpscalingImage, setIsUpscalingImage] = useState(false);

    const {
        image: {
            onOpenTemplateImageEditPanel
        },
    } = useEditorMediaLibraries();
    const [currentLibraryAndAsset] = useState(() => onOpenTemplateImageEditPanel(baseImageFieldURL));

    // Subscribe to updates from the current library when its internal list of upscaling images change
    useEffect(() => {
        if (currentLibraryAndAsset) {
            const {
                library,
                asset
            } = currentLibraryAndAsset;

            const setIsUpscaling = (currentlyUpscalingAssets) => {
                const upscalingAsset = currentlyUpscalingAssets.find(
                    (currentyUpscalingAsset) => currentyUpscalingAsset.guid === asset.guid,
                );

                setIsUpscalingImage(Boolean(upscalingAsset));
            };

            // The subscription cleanup function is returned so we can use it as the effect return value
            return library.subscribeToUpscalingAssetChanges(setIsUpscaling, true);
        }

        return () => {};
    }, [currentLibraryAndAsset, setIsUpscalingImage]);

    return ( <
        ErrorBoundary containerClass = {
            styles.ErrorBoundaryContainer
        } >
        <
        UpscaleLibraryImageToggle currentlyEditingImageField = {
            currentlyEditingImageField
        }
        currentLibraryAndAsset = {
            currentLibraryAndAsset
        }
        isUpscalingImage = {
            isUpscalingImage
        }
        />

        <
        CrossFadeTransition transitionKey = {
            isUpscalingImage ? 'upscaling' : 'editing'
        }
        enterDuration = {
            200
        } >
        {
            isUpscalingImage ? ( <
                RotatingLoader className = {
                    styles.LoadingSpinner
                }
                />
            ) : ( <
                >
                <
                EditorImageFitAndFillControls currentlyEditingImageField = {
                    currentlyEditingImageField
                }
                baseImageFieldURL = {
                    baseImageFieldURL
                }
                /> <
                EditorImageFilterControls currentlyEditingImageField = {
                    currentlyEditingImageField
                }
                baseImageFieldURL = {
                    baseImageFieldURL
                }
                /> <
                />
            )
        } <
        /CrossFadeTransition> <
        /ErrorBoundary>
    );
}
TemplateImagesEditPanel.propTypes = {
    currentlyEditingImageField: editorPropTypes.editorImageField.isRequired,
    baseImageFieldURL: PropTypes.string.isRequired,
};