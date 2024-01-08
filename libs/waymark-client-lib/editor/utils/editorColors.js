// Vendor
import tinycolor from 'tinycolor2';

// Local
import Color from 'app/models/colorLibraries/Color';

/* WAYMARK APP DEPENDENCIES */
import {
    convertRange
} from 'shared/utils/math.js';
/* END WAYMARK APP DEPENDENCIES */

/**
 * Generates a row of colors with a given hue and saturation for a generated color grid
 *
 * @param {number} rowHue         Hue value to use for all colors in the row
 * @param {number} rowSaturation  Saturation value to use for all colors in the row
 * @param {number} numColumns     Number of columns the row should have
 */
const makeColorRow = (rowHue, rowSaturation, numColumns) => {
    const colorRow = new Array(numColumns);

    for (let colorColumn = 0; colorColumn < numColumns; colorColumn += 1) {
        // Each column applies a different lightness for the row's hue/saturation, going from darkest to lightest
        const columnLightness =
            rowSaturation === 0 ? // Map columns 0->numColumns-1 (inclusive) to lightess 0->100 (inclusive) so we can go from
            // full black to full white
            convertRange(colorColumn, 0, numColumns - 1, 0, 100) : // Map columns 0->numColumns-1 (inclusive) to lightess 20->95 (inclusive) for non-grayscale colors
            // The range of 20-95 is pretty arbitrary but just looks the best since lightness levels < 20 look too dark and > 95 look too white
            convertRange(colorColumn, 0, numColumns - 1, 20, 95);

        const hexCode = tinycolor({
            h: rowHue,
            s: rowSaturation,
            l: columnLightness
        }).toHexString();

        colorRow[colorColumn] = new Color({
            hexCode,
            displayName: hexCode,
            order: 1,
            updatedAt: null
        });
    }

    return colorRow;
};

/**
 * Constructs a grid of "basic color" hex codes to display in the editor's color library
 *
 * @param {number} numRows    Number of rows to include in the grid
 *                              The first row will always be grayscale colors ranging from black -> white
 *                              All subsequent rows will increment over hue values from 0 -> 360; the more columns, the smaller the hue differences
 *                                will be between each row
 * @param {number} numColumns Number of columns to include in the grid - each column increments the lightness of the row's color from darkest -> lightest
 */
export const makeColorGrid = (rowHues, numColumns) => {
    // The first row should have 0 saturation so it can be a grayscale range from black to white
    let basicColors = makeColorRow(0, 0, numColumns);

    rowHues.forEach((rowHue) => {
        // All other rows have saturation of 85 - this is a fairly arbitrary value that looks good
        basicColors = basicColors.concat(makeColorRow(rowHue, 85, numColumns));
    });

    return basicColors;
};

/**
 * @typedef   {object}  FormattedEditorColorField
 * @property  {object}  fieldConfig         The color field config from the editor form description
 * @property  {func}    onSelectEditField   Selects the color field for editing in the editor UI
 * @property  {boolean} isSelected          Whether the color field is currently selected for editing
 */

/**
 * Constructs a `FormattedEditorColorField` object describing a color field to display in the color controls
 *
 * @param {object}  fieldConfig               The color field's editor form description config
 * @param {func}    onSelectEditField         Updates which color field is currently being updated and jumps the video to that field's display time
 * @param {string}  currentlyEditingFieldKey  The unique field key identifying which color field is currently selected for editing
 *                                              We will use this to inform the UI whether a color field is currently selected or not by checking
 *                                              if the given field config's key matches the currently selected key
 *
 * @returns {FormattedEditorColorField}   Formatted object describing a color field to display in the color control panel
 */
export const getFormattedEditorColorField = (
    fieldConfig,
    onSelectEditField,
    currentlyEditingFieldKey,
) => ({
    fieldConfig,
    onSelectEditField: () => onSelectEditField(fieldConfig),
    // Indicate if this field is the one currently selected for editing
    isSelected: currentlyEditingFieldKey === fieldConfig.editingFieldKey,
});

/**
 * Constructs a formatted `ColorLibraryColor` object to represent an item in a color library section
 *
 * @param {object}  libraryColor                    Object with the color's hex code and display name
 * @param {func}    onSelectColor                   Updates the currently selected color field's configuration values with a given hex code
 * @param {string}  currentlyEditingFieldHexCode   The hex code of the color currently being used for the currently selected color field
 *
 * @returns {ColorLibraryColor}   Formatted object describing an item to display in a color library section
 */
export const getFormattedEditorColorLibraryColor = (
    libraryColor,
    onSelectColor,
    currentlyEditingFieldHexCode,
) => ({
    hexCode: libraryColor.hexCode,
    displayName: libraryColor.displayName || libraryColor.hexCode,
    onSelectColor: () => onSelectColor(libraryColor.hexCode),
    // A library item is selected if its color matches the color of the currently selected field
    isSelected: libraryColor.hexCode === currentlyEditingFieldHexCode,
});

/**
 * Constructs a formatted `ColorLibrarySection` object for a section to display in the editor color
 *
 * @param {string}    displayName                     The name to display as the heading of the library section
 * @param {object[]}  libraryColors                   An array of color objects with a hex code and display name which will be included in this section
 * @param {func}      onSelectColor                   Updates the currently selected color field's configuration values with a given hex code
 * @param {string}    currentlyEditingFieldHexCode   The hex code of the color currently being used for the currently selected color field
 *
 * @returns {ColorLibrarySection}  Formatted object describing a section to be displayed in the editor color library
 */
export const getFormattedColorLibrarySection = (
    displayName,
    libraryColors,
    onSelectColor,
    currentlyEditingFieldHexCode,
) => ({
    displayName,
    colors: libraryColors.map((libraryColor) =>
        getFormattedEditorColorLibraryColor(libraryColor, onSelectColor, currentlyEditingFieldHexCode),
    ),
});

// Hex code matches all invalid characters we want to strip out when formatting our hex code
const INVALID_HEX_CHARACTER_REGEX = /[^A-F0-9]*/g;

/**
 * Takes an unformatted string and formats it into a valid 6-digit hex code
 *
 * @param {string} unformattedDisplayHexString    The raw hex code string input to format
 *
 * @returns {object}  configurationHexs
 * @returns {string}  configurationHexs.displayHex          The cleaned up version of the hex code that was received as our input
 *                                                            Will be properly formatted but may not necessarily match the configuration-ready code
 *                                                            if the received input wasn't 6/8 characters
 * @returns {string}  configurationHexs.configurationHex    The fully formatted 6/8 digit hex code generated from the input
 */
export const formatUserHexInput = (unformattedDisplayHexString = '') => {
    // Clean up the input string so it follows a consistent format we can work with
    const formattedDisplayHex = unformattedDisplayHexString
        // Remove trailing spaces
        .trim()
        // Format as all caps
        .toUpperCase()
        // Strip out all characters that aren't valid in hexadecimal, including the leading "#"
        .replace(INVALID_HEX_CHARACTER_REGEX, '')
        // Limit to 6 characters at most
        .substring(0, 6);

    // The final formatted hex code string we will return
    let configurationHex;

    const hexCodeLength = formattedDisplayHex.length;

    if (hexCodeLength <= 1) {
        // If our hex code is 1 digit, we'll treat it as a channel shorthand value and use that value for all color channels
        // ie, "F" -> "FFFFFF"
        // We will treat an empty string as "F", so "" -> "FFFFFF"
        const channelShorthandValue = formattedDisplayHex || 'F';

        configurationHex = channelShorthandValue.repeat(6);
    } else if (hexCodeLength === 2) {
        // If we have a 2 digit hex code, we'll use that value for all color channels
        // ie, "F9" -> "F9F9F9"
        const channelValue = formattedDisplayHex;

        configurationHex = channelValue.repeat(3);
    } else if (hexCodeLength === 3) {
        // If we have a 3 digit hex code, we'll treat each character as a channel shorthand value and expand them out
        // to a full 6-digit code
        // ie, "ABC" -> "AABBCC"
        // Using array destructuring to get the values for each channel
        const [red, green, blue] = formattedDisplayHex;

        configurationHex = `${red.repeat(2)}${green.repeat(2)}${blue.repeat(2)}`;
    } else {
        // If our hex code is longer than 3 digits but still 6 or less, we'll expand it to 6 digits by filling in 0s on the end
        // ie, "ABC123" -> "ABC123", "ABC1" -> "ABC100"
        configurationHex = `${formattedDisplayHex}${'0'.repeat(6 - hexCodeLength)}`;
    }

    return {
        // The cleaned up but not fully formatted input hex code to display in the hex code text input
        displayHex: `${
      // If our formatted display hex code is longer than 0 characters or includes a "#",
      // insert a "#" at the front of the display hex. Otherwise, if we essentially got an empty string,
      // we will just display an empty string in the text input
      hexCodeLength > 0 || unformattedDisplayHexString.includes('#') ? '#' : ''
    }${formattedDisplayHex}`,
        // The fully formatted 6 digit hex code that we can save and use in the configuration
        configurationHex: `#${configurationHex}`,
    };
};