// Vendor
import parseColor from 'parse-color';

/**
 * @namespace ImgixAPITransforms
 */

/**
 * Util to remove the leading zreo in decimals. Helpful for numberic imgix
 * query param values -- imgix expects .5 rather than 0.5.
 *
 * @param  {*} value  Any value -- we only modify if it's a number.
 * @returns {string} The value without a 0 in front
 * @memberof ImgixAPITransforms
 * @public
 */
export const removeLeadingZero = (value) => {
    if (typeof value === 'number') {
        // Imgix doesn't like leading zeroes in numeric values.
        return value.toString().replace('0.', '.');
    }
    return value;
};

/**
 * Handles the translation of a Waymark cropping object with keys
 * { x, y, width, height }
 *
 * @param  {object}   cropping    Waymark cropping object
 * @returns {string}   Value for the imgix `rect` query param.
 * @memberof ImgixAPITransforms
 * @public
 */
export const croppingToImgixRect = (cropping) => {
    const {
        x,
        y,
        width,
        height
    } = cropping;
    return [x, y, width, height].map(removeLeadingZero).join(',');
};

/**
 * Convert a Waymark API float input value to an Imgix decimal number.
 * API float inputs are generally in the -1 to 1 range, but can be -1 to 0 or 0 to 1 depending on
 * the respective Imgix API requirements.
 *
 * @param  {number} value Waymark API float value
 * @returns {number}       Imgix API value
 * @memberof ImgixAPITransforms
 * @public
 */
export const floatToImgixNumber = (value) => Math.round(value * 100);

/**
 * Convert a hex color string to an Imgix query parameter color.
 *
 * 4, 7, and 9 character strings are accepted as input (3, 6, and 8 without the # symbol)
 *
 * Examples:
 *   #RGB      -> RGB
 *   #RRGGBB   -> RRGGBB
 *   #RRGGBBAA -> AARRGGBB
 *
 * @param {string} cssColor Hex color string
 * @returns {string} Imgix color string
 * @memberof ImgixAPITransforms
 * @public
 */
export const cssColorToImgixColor = (cssColor) => {
    const color = parseColor(cssColor);
    if (!color.hex) {
        throw new Error(`Unable to parse color: ${cssColor}`);
    }

    let imgixColor = color.hex.substring(1);

    if (imgixColor.length === 8) {
        imgixColor = `${imgixColor.substring(6)}${imgixColor.substring(0, 6)}`;
    }

    return imgixColor;
};

/**
 * Converts an array of hex color strings to a comma-joined string of Imgix query parameter colors.
 *
 * 4, 7, and 9 character strings are accepted as input (3, 6, and 8 without the # symbol)
 *
 * Examples:
 *   #RGB      -> RGB
 *   #RRGGBB   -> RRGGBB
 *   #RRGGBBAA -> AARRGGBB
 *
 * @param  {Array}    cssColors   Hex color strings.
 * @returns {string}               Comma-joined string of Imgix color string.
 * @memberof ImgixAPITransforms
 * @public
 */
export const cssColorArrayToImgixColorString = (cssColors) =>
    cssColors.map((color) => cssColorToImgixColor(color)).join();