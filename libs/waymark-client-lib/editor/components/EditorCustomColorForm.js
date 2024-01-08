// Vendor
import {
    useState,
    useRef,
    useEffect,
    useCallback
} from 'react';
import PropTypes from 'prop-types';
import {
    SketchPicker
} from 'react-color';
import Modernizr from 'modernizr';

// Local
import {
    formatUserHexInput
} from 'editor/utils/editorColors.js';

/* WAYMARK APP DEPENDENCIES */
import {
    SearchIcon
} from 'app/icons/BasicIcons';
import WaymarkTextInput from 'shared/components/WaymarkTextInput';
import {
    WaymarkButton
} from 'shared/components/WaymarkButton';
import {
    useIsWindowMobile
} from 'app/hooks/windowBreakpoint.js';
import useWindowEvent from 'app/hooks/windowEvent.js';
import withWaymarkModal from 'shared/components/WithWaymarkModal';
/* END WAYMARK APP DEPENDENCIES */

import * as styles from './EditorCustomColorForm.css';

const browserHasColorInputSupport = Modernizr.inputtypes.color;

/**
 * Renders a react-color color picker which can be used to select a custom color
 *
 * @param {string}  colorHex        The current formatted color to show as selected in the color picker UI
 * @param {func}    onColorChange   Updates the current color
 */
const FallbackColorPickerModalContents = ({
    colorHex,
    onColorChange
}) => ( <
    SketchPicker width = "100%"
    color = {
        colorHex
    }
    onChange = {
        ({
            hex
        }) => onColorChange(hex)
    }
    className = {
        styles.FallbackColorPicker
    }
    disableAlpha /
    >
);
FallbackColorPickerModalContents.propTypes = {
    colorHex: PropTypes.string.isRequired,
    onColorChange: PropTypes.func.isRequired,
};

const FallbackColorPickerModal = withWaymarkModal()(FallbackColorPickerModalContents);

/**
 * Modal provides controls for adding a color to the user's custom account colors
 *
 * @param {func}    onSubmitCustomColor      Select a given hex code for the current color field in the video
 * @param {string}  defaultHexCode           When provided sets the initial color shown by the color picker.
 */
const EditorCustomColorForm = ({
    onSubmitCustomColor,
    defaultHexCode = ''
}) => {
    const colorFormRow = useRef();
    const [colorFormRowHeight, setColorFormRowHeight] = useState(0);
    const [formattedColor, setFormattedColor] = useState(() =>
        // Set up default state with the provided default.
        formatUserHexInput(defaultHexCode),
    );

    // Keep track of whether to show fallback color picker modal
    const [isShowingFallbackColorPicker, setIsShowingFallbackColorPicker] = useState(false);

    const isMobile = useIsWindowMobile();

    // We should use the fallback color picker if we're on mobile or if the browser does not have support for
    // color inputs
    const shouldUseFallbackColorPicker = isMobile || !browserHasColorInputSupport;

    // Calculate the width/height to display our color preview box at
    const onWindowResize = useCallback(() => {
        setColorFormRowHeight(colorFormRow.current ? colorFormRow.current.clientHeight : 0);
    }, []);

    // Execute an initial size calculation on mount
    useEffect(onWindowResize, [onWindowResize]);

    // Recalculate sizing on window resize events
    useWindowEvent('resize', onWindowResize);

    // Reset the default color if it changes (ie. someone picks a different template color to change)
    useEffect(() => {
        setFormattedColor(formatUserHexInput(defaultHexCode));
    }, [defaultHexCode]);

    // When an input changes, get its new unformatted string value and format it to be displayed in the UI
    const onColorInputChange = (event) => setFormattedColor(formatUserHexInput(event.target.value));

    // Create a new account custom color and select it
    const onSubmitColor = (event) => {
        event.preventDefault();

        // Select the color to be used for the current color field
        onSubmitCustomColor(formattedColor.configurationHex);
    };

    // The search icon can disappear on the color picker if it's too close to the currently
    // selected color, so use white or black as the icon color depending.
    const decimalColorValue = parseInt(formattedColor.configurationHex.slice(1), 16);
    // Color values range from 0 to 2^24,and 23.3 is just an empirically chosen value that
    // seems to work well as the transition point.
    const isSearchIconDark = decimalColorValue < 2 ** 23.3;
    const searchIconColor = isSearchIconDark ? '#FFFFFF' : '#000000';

    return ( <
        form onSubmit = {
            onSubmitColor
        }
        className = {
            styles.ColorInputForm
        }
        ref = {
            colorFormRow
        } { ...styles.dataHasSelectedColor(Boolean(formattedColor.displayHex))
        } >
        <
        WaymarkTextInput onChange = {
            onColorInputChange
        }
        // Controlled input only shows a cleaned up/formatted version of what the user typed
        value = {
            formattedColor.displayHex
        }
        className = {
            styles.ColorTextInputWrapper
        }
        inputClassName = {
            styles.ColorTextInput
        }
        placeholder = "Color code"
        shouldFocusOnMount /
        >
        <
        label className = {
            styles.ColorInputLabel
        }
        title = "Open color picker"
        htmlFor = "custom-color-eye-dropper-input"
        style = {
            {
                // Ensure the button is square and fills the height of the row
                height: colorFormRowHeight,
                width: colorFormRowHeight,
                backgroundColor: formattedColor.configurationHex,
            }
        } >
        <
        SearchIcon color = {
            searchIconColor
        }
        style = {
            {
                // Increase the stroke width to 2 for white icons on dark background to improve visibility
                strokeWidth: isSearchIconDark ? 2 : 1,
            }
        }
        /> <
        input
        // If we're going to use the fallback color picker, just use a button -
        // otherwise use a color input which will open the system's color picker
        type = {
            shouldUseFallbackColorPicker ? 'button' : 'color'
        }
        value = {
            formattedColor.configurationHex
        }
        onInput = {
            onColorInputChange
        }
        onChange = {
            onColorInputChange
        }
        className = {
            styles.ColorPickerInput
        }
        id = "custom-color-eye-dropper-input"
        onClick = {
            shouldUseFallbackColorPicker ?
            (event) => {
                // If we're using the fallback color picker, clicking this input will open the modal
                event.preventDefault();
                setIsShowingFallbackColorPicker(true);
            } :
                null
        }
        /> <
        /label> <
        WaymarkButton colorTheme = "Primary"
        isSmall className = {
            styles.SubmitColorButton
        }
        type = "submit"
        isDisabled = {!formattedColor.displayHex
        } >
        Add <
        /WaymarkButton> {
            shouldUseFallbackColorPicker && ( <
                FallbackColorPickerModal colorHex = {
                    formattedColor.configurationHex
                }
                onColorChange = {
                    (newColor) => setFormattedColor(formatUserHexInput(newColor))
                }
                isVisible = {
                    isShowingFallbackColorPicker
                }
                onCloseModal = {
                    () => setIsShowingFallbackColorPicker(false)
                }
                cancelInterface = "text"
                cancelButtonText = "Done" /
                >
            )
        } <
        /form>
    );
};
EditorCustomColorForm.propTypes = {
    onSubmitCustomColor: PropTypes.func.isRequired,
    defaultHexCode: PropTypes.string,
};

export default EditorCustomColorForm;