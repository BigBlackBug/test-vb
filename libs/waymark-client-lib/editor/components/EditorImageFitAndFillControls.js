// Vendor
import _ from 'lodash';
import {
    useEffect,
    useState,
    useCallback
} from 'react';
import PropTypes from 'prop-types';

// Editor
import {
    defaultFitFillMode,
    DefaultImageModifications,
    FitFillModes,
    ImageModificationKeys,
} from 'editor/constants/EditorImage.js';
import EditorImageFillContainerControls from 'editor/components/EditorImageFillContainerControls';
import EditorImageFitImageControls from 'editor/components/EditorImageFitImageControls.js';
import editorPropTypes from 'editor/constants/editorPropTypes.js';
import {
    EditorControlSectionHeading
} from 'editor/components/EditorControlHeadings';
import ImageCropper from 'editor/components/ImageCropper.js';
import ImageFocalPointSelector from 'editor/components/ImageFocalPointSelector.js';

// Shared
import SelectInput from 'shared/components/SelectInput';
import {
    addQueryParametersToURL
} from 'shared/utils/urls.js';
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';
import {
    DynamicBackgroundProgressiveImage
} from 'shared/components/DynamicBackgroundProgressiveImage';

// Styles
import * as styles from './EditorImageFitAndFillControls.css';

const FIT_FILL_OPTIONS = [{
        label: 'Fill the whole container',
        mode: FitFillModes.fillContainer,
    },
    {
        label: 'Fit my entire image',
        mode: FitFillModes.fitImage,
    },
];

const fitImageModeHelpText = {
    [FitFillModes.fitImage]: 'Crop your image and choose how to fill the space around your image.',
    [FitFillModes.fillContainer]: `Adjust your point of focus and zoom. If you're having trouble showing parts of your image, try switching to "Fit my entire image."`,
};

const EditorImageFitAndFillControls = ({
    currentlyEditingImageField,
    baseImageFieldURL
}) => {
    const {
        useCurrentImageModificationsValue,
        useUpdateImageModifications
    } =
    currentlyEditingImageField;

    const currentFitModeModificationValue = useCurrentImageModificationsValue(
        ImageModificationKeys.fit,
    );
    const updateImageModifications = useUpdateImageModifications();

    /**
     * Sets default image modifications for the selected fit while preserving any adjustments
     * that have previously been applied to the image.
     *
     * @param  {string}  selectedFit    Image fit selected by the UI -->
     *                                  FitFillModes.fitImage || FitFillModes.fillContainer
     */
    const setDefaultModificationsWithAdjustments = useCallback(
        (selectedFit) => {
            // Set image modifications to the default for whichever mode has been selected
            updateImageModifications((allCurrentModifications) => {
                const defaultModifications = _.cloneDeep(DefaultImageModifications[selectedFit]);

                // If the default modifications were already set (like when a user selects a new image from the image library),
                // and are equal to the default modifications for this selected fit, no need to update.
                if (_.isEqual(allCurrentModifications, defaultModifications)) {
                    return allCurrentModifications;
                }

                if (allCurrentModifications && allCurrentModifications.adjustments) {
                    // If there are filter adjustments on the current modifications, hang onto those
                    defaultModifications.adjustments = allCurrentModifications.adjustments;
                }

                return defaultModifications;
            }, ImageModificationKeys.all);
        }, [updateImageModifications],
    );

    useEffect(() => {
        if (!currentFitModeModificationValue) {
            // If we don't a fit mode explicitly set, the renderer defaults to fit mode,
            // so set some default modifications to reflect that in our configuration
            setDefaultModificationsWithAdjustments(defaultFitFillMode);
        }
    }, [currentFitModeModificationValue, setDefaultModificationsWithAdjustments]);

    const onSelectMode = (selectedFit) => {
        // Reset image modifications to the default for whichever mode has just been selected
        setDefaultModificationsWithAdjustments(selectedFit);
    };

    const [hasImagePreviewLoaded, setHasImagePreviewLoaded] = useState(false);

    // Don't render anything until we've set an initial fit mode in the configuration
    if (!currentFitModeModificationValue) {
        return null;
    }

    return ( <
        >
        <
        EditorControlSectionHeading heading = "Fit & Fill"
        className = {
            styles.SectionHeading
        }
        /> <
        SelectInput fieldProps = {
            {
                onChange: (event) => onSelectMode(event.target.value),
                value: currentFitModeModificationValue,
                className: styles.ModeSelectInput,
            }
        }
        options = {
            FIT_FILL_OPTIONS.map((option) => ({
                text: option.label,
                value: option.mode,
            }))
        }
        /> <
        p className = {
            styles.ModeHelpText
        } > {
            fitImageModeHelpText[currentFitModeModificationValue]
        } < /p> {
            baseImageFieldURL ? ( <
                div className = {
                    styles.ImagePreviewSection
                } >
                <
                DynamicBackgroundProgressiveImage src = {
                    addQueryParametersToURL(baseImageFieldURL, {
                        auto: 'compress',
                        w: '324'
                    })
                }
                alt = ""
                imageWrapperClassName = {
                    styles.PlaceholderImageWrapper
                }
                onLoad = {
                    () => setHasImagePreviewLoaded(true)
                }
                overlayClassName = {
                    styles.PlaceholderImageOverlay
                }
                shouldFillWidth /
                > { /* Once the image has loaded, show either the crop or focal point overlay UI over the image based on the current fit mode */ } {
                    hasImagePreviewLoaded &&
                        (currentFitModeModificationValue === FitFillModes.fitImage ? ( <
                            ImageCropper useCurrentImageModificationsValue = {
                                useCurrentImageModificationsValue
                            }
                            updateImageModifications = {
                                updateImageModifications
                            }
                            />
                        ) : ( <
                            ImageFocalPointSelector useCurrentImageModificationsValue = {
                                useCurrentImageModificationsValue
                            }
                            updateImageModifications = {
                                updateImageModifications
                            }
                            />
                        ))
                } <
                /div>
            ) : null
        } { /* Fade between different controls based on whether we're in "fit image" or "fill container" mode */ } <
        FadeSwitchTransition transitionKey = {
            currentFitModeModificationValue
        }
        duration = {
            100
        } > {
            currentFitModeModificationValue === FitFillModes.fitImage ? ( <
                EditorImageFitImageControls useCurrentImageModificationsValue = {
                    useCurrentImageModificationsValue
                }
                updateImageModifications = {
                    updateImageModifications
                }
                baseImageFieldURL = {
                    baseImageFieldURL
                }
                />
            ) : ( <
                EditorImageFillContainerControls useCurrentImageModificationsValue = {
                    useCurrentImageModificationsValue
                }
                updateImageModifications = {
                    updateImageModifications
                }
                />
            )
        } <
        /FadeSwitchTransition> <
        />
    );
};
EditorImageFitAndFillControls.propTypes = {
    currentlyEditingImageField: editorPropTypes.editorImageField.isRequired,
    baseImageFieldURL: PropTypes.string.isRequired,
};

export default EditorImageFitAndFillControls;