// Vendor
import PropTypes from 'prop-types';

// Editor
import {
    fitFillModes,
    defaultFitFillModeModifications
} from 'editor/constants/EditorVideo.js';

// Shared
import SelectInput from 'shared/components/SelectInput';

/**
 * Renders a drop-down selector for selecting which fit mode to use for the video field
 *
 * @param {string}    selectedFitMode   Fit more to use on the video field (ie, "fill container", "fit video")
 * @param {function}  updateVideoConfigurationValue   Updates the video field's configuration value
 */
export default function EditorVideoFitModeSelector({
    selectedFitMode,
    updateVideoConfigurationValue,
}) {
    const updateFitFillSelection = (selectedFitFillValue) => {
        // Get the key/value pairs for all of the values we need to update in the configuration based on the new
        // fit/fill mode selection
        const newDefaultModifications = defaultFitFillModeModifications[selectedFitFillValue];

        // Update all of the appropriate key/value pairs in the configuration
        updateVideoConfigurationValue((currentVideoConfigurationValue) => ({
            ...currentVideoConfigurationValue,
            // Fill in default modifications for the new fit mode
            ...newDefaultModifications,
        }));
    };

    return ( <
        SelectInput fieldProps = {
            {
                onChange: (event) => {
                    const selectedFitFillValue = event.target.value;
                    updateFitFillSelection(selectedFitFillValue);
                },
                value: selectedFitMode,
            }
        }
        options = {
            [{
                    text: 'Fill the whole container',
                    value: fitFillModes.fillContainer,
                },
                {
                    text: 'Fit my entire video',
                    value: fitFillModes.fitVideo,
                },
            ]
        }
        />
    );
}
EditorVideoFitModeSelector.propTypes = {
    selectedFitMode: PropTypes.string.isRequired,
    updateVideoConfigurationValue: PropTypes.func.isRequired,
};