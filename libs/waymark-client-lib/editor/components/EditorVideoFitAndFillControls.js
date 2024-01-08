// Vendor
import _ from 'lodash';
import {
    useCallback
} from 'react';
import PropTypes from 'prop-types';
import {
    css
} from '@emotion/css';

// Editor
import EditorFillColorControls from 'editor/components/EditorFillColorControls.js';
import EditorControlsSlider from 'editor/components/EditorControlsSlider';
import {
    modificationConfigurationPaths,
    fitFillModes,
    defaultZoomModificationValue,
    defaultBackgroundFill,
    defaultPadding,
} from 'editor/constants/EditorVideo.js';
import {
    baseEditorColorOptions
} from 'editor/constants/EditorColors.js';

// APP DEPENDENCIES
import FadeSwitchTransition from 'shared/components/FadeSwitchTransition';

// Base colors to use for the fit controls color swatch along with colors from the template
const baseFillColors = [baseEditorColorOptions.black, baseEditorColorOptions.white];

/**
 * Renders padding slider and background color picker for use when in "fit video" mode
 *
 * @param {Object}  currentConfigurationValue   The current configuration value object for the video field
 * @param {func}    updateVideoModification   Updates modification values on the video field's configuration
 */
const FitVideoControls = ({
    currentConfigurationValue,
    updateVideoModification
}) => {
    const currentBackgroundFillColorValue = _.get(
        currentConfigurationValue,
        modificationConfigurationPaths.backgroundFill,
        defaultBackgroundFill,
    );

    const onChangeFillColor = useCallback(
        (selectedFillColor) =>
        updateVideoModification(selectedFillColor, modificationConfigurationPaths.backgroundFill), [updateVideoModification],
    );

    const currentPaddingValue = _.get(
        currentConfigurationValue,
        modificationConfigurationPaths.padding,
        defaultPadding,
    );
    // Using useCallback to avoid messing up the slider's debounced onChange callback
    const onChangePadding = useCallback(
        (newPadding) => updateVideoModification(newPadding, modificationConfigurationPaths.padding), [updateVideoModification],
    );

    return ( <
        >
        <
        EditorControlsSlider label = "Padding"
        controlledValue = {
            currentPaddingValue
        }
        onChange = {
            onChangePadding
        }
        // Debounce the onChange event by 100ms
        onChangeDebounceTime = {
            100
        }
        min = {
            0
        }
        max = {
            250
        }
        className = {
            css `
          margin: 12px 0;
        `
        }
        /> <
        EditorFillColorControls onSelectFillColor = {
            onChangeFillColor
        }
        selectedFillColor = {
            currentBackgroundFillColorValue
        }
        baseHexColors = {
            baseFillColors
        }
        className = {
            css `
          margin: 12px 0 42px;
        `
        }
        /> <
        />
    );
};
FitVideoControls.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    currentConfigurationValue: PropTypes.object.isRequired,
    updateVideoModification: PropTypes.func.isRequired,
};

/**
 * Renders zoom slider for use when in "fill container" mode
 *
 * @param {Object}  currentConfigurationValue   The current configuration value object for the video field
 * @param {func}    updateVideoModification   Updates modification values on the video field's configuration
 */
const FillContainerControls = ({
    currentConfigurationValue,
    updateVideoModification
}) => {
    const currentZoomFocalPointData = _.get(
        currentConfigurationValue,
        modificationConfigurationPaths.zoom.all,
        defaultZoomModificationValue,
    );

    // Using useCallback to avoid messing up the slider's debounced onChange callback
    const onChangeZoom = useCallback(
        (newZoom) => {
            updateVideoModification((currentZoomModificationValue) => {
                // Get the focal point's x and y positions or fill in with defaults so we can
                // ensure we're creating a valid zoom modification object
                const focalPointX = _.get(
                    currentZoomModificationValue,
                    'x',
                    defaultZoomModificationValue.x,
                );
                const focalPointY = _.get(
                    currentZoomModificationValue,
                    'y',
                    defaultZoomModificationValue.y,
                );

                return {
                    x: focalPointX,
                    y: focalPointY,
                    z: newZoom,
                };
            }, modificationConfigurationPaths.zoom.all);
        }, [updateVideoModification],
    );

    return ( <
        EditorControlsSlider label = "Zoom"
        controlledValue = {
            currentZoomFocalPointData.z
        }
        onChange = {
            onChangeZoom
        }
        // Debounce the onChange event by 100ms
        onChangeDebounceTime = {
            100
        }
        min = {
            1
        }
        max = {
            5
        }
        step = {
            0.05
        }
        className = {
            css `
        margin: 12px 0 42px;
      `
        }
        />
    );
};
FillContainerControls.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    currentConfigurationValue: PropTypes.object.isRequired,
    updateVideoModification: PropTypes.func.isRequired,
};

/**
 * Displays dropdown selector and additional controls for editing the video in fit or fill mode
 */
const EditorVideoFitAndFillControls = ({
    currentConfigurationValue,
    updateVideoModification,
    selectedFitMode,
}) => ( <
    FadeSwitchTransition transitionKey = {
        selectedFitMode
    }
    duration = {
        100
    } > {
        selectedFitMode === fitFillModes.fitVideo ? ( <
            FitVideoControls currentConfigurationValue = {
                currentConfigurationValue
            }
            updateVideoModification = {
                updateVideoModification
            }
            />
        ) : ( <
            FillContainerControls currentConfigurationValue = {
                currentConfigurationValue
            }
            updateVideoModification = {
                updateVideoModification
            }
            />
        )
    } <
    /FadeSwitchTransition>
);

EditorVideoFitAndFillControls.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    currentConfigurationValue: PropTypes.object.isRequired,
    updateVideoModification: PropTypes.func.isRequired,
    selectedFitMode: PropTypes.string.isRequired,
};

export default EditorVideoFitAndFillControls;