// Vendor
import {
    useCallback
} from 'react';
import PropTypes from 'prop-types';

// Editor
import {
    ImageModifications,
    PaddingMinValue
} from 'editor/constants/EditorImage.js';
import {
    baseEditorColorOptions
} from 'editor/constants/EditorColors.js';
import EditorFillColorControls from 'editor/components/EditorFillColorControls.js';
import EditorControlsSlider from 'editor/components/EditorControlsSlider';

// Shared
import {
    addQueryParametersToURL
} from 'shared/utils/urls.js';

/* WAYMARK APP DEPENDENCIES */
import useHttpResponse from 'app/hooks/httpResponse.js';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './EditorImageFitImageControls.css';

const PADDING_PATH = ImageModifications.padding.path;
const BACKGROUND_FILL_PATH = ImageModifications.backgroundFill.path;

// Number of colors to supply to the palette from the image using the imgix api
const IMAGE_COLORS_COUNT = 6;
const DOMINANT_COLOR_NAMES = ['muted_dark', 'muted', 'muted_light'];

const formatColorPaletteResponseData = ({
    dominant_colors: dominantColors,
    colors: mostFrequentColors,
}) => {
    const colors = Object.values(baseEditorColorOptions);

    if (dominantColors) {
        DOMINANT_COLOR_NAMES.forEach((colorName) => {
            const dominantColor = dominantColors[colorName];

            if (dominantColor && !colors.includes(dominantColor.hex)) {
                colors.push(dominantColor.hex);
            }
        });
    }

    let remainingColorsToFill = IMAGE_COLORS_COUNT - colors.length;

    if (mostFrequentColors) {
        // The imgix API isn't guaranteed to always return each type of dominant color or even any dominant colors
        // at all, so just to be safe let's make sure we fill out any remaining gaps from the generic colors list
        for (
            let i = 0, numOtherColors = mostFrequentColors.length; i < numOtherColors && remainingColorsToFill > 0; i += 1
        ) {
            const otherColorHex = mostFrequentColors[i].hex;

            // Prevent duplicate colors
            if (!colors.includes(otherColorHex)) {
                colors.push(otherColorHex);
                remainingColorsToFill -= 1;
            }
        }
    }

    return colors;
};

const EditorImageFitImageControls = ({
    useCurrentImageModificationsValue,
    updateImageModifications,
    baseImageFieldURL,
}) => {
    const initialPaddingAmount = useCurrentImageModificationsValue(PADDING_PATH) || PaddingMinValue;

    // Using a callback to avoid messing up the slider's debounced callback
    const onChangePadding = useCallback(
        (newPaddingAmount) => updateImageModifications(newPaddingAmount, PADDING_PATH), [updateImageModifications],
    );

    const colorPaletteHexCodes = useHttpResponse(
        addQueryParametersToURL(baseImageFieldURL, {
            palette: 'json',
            colors: IMAGE_COLORS_COUNT,
        }),
        formatColorPaletteResponseData,
    );

    const selectedBackgroundColor = useCurrentImageModificationsValue(BACKGROUND_FILL_PATH);

    return ( <
        >
        <
        EditorFillColorControls onSelectFillColor = {
            (hexColor) => updateImageModifications(hexColor, BACKGROUND_FILL_PATH)
        }
        additionalHexColors = {
            colorPaletteHexCodes || []
        }
        selectedFillColor = {
            selectedBackgroundColor
        }
        /> <
        EditorControlsSlider label = "Padding"
        initialSliderValue = {
            initialPaddingAmount
        }
        onChange = {
            onChangePadding
        }
        onChangeDebounceTime = {
            300
        }
        min = {
            PaddingMinValue
        }
        max = {
            250
        }
        className = {
            styles.PaddingSlider
        }
        /> <
        />
    );
};
EditorImageFitImageControls.propTypes = {
    useCurrentImageModificationsValue: PropTypes.func.isRequired,
    updateImageModifications: PropTypes.func.isRequired,
    baseImageFieldURL: PropTypes.string.isRequired,
};

export default EditorImageFitImageControls;