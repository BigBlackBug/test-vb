import _ from 'lodash';
import tinycolor from 'tinycolor2';

/**
 * Takes a hex color and converts into an object with rgb keys
 * @method hexToRGB
 * @param  {String}   colorHex   A hex string in the format of '#FFFFFF' or 'FFFFFF'
 * @return {Object}              An object with the keys r, b, g corresonding to the
 *                               red, blue, and green color values
 */
export function hexToRGB(colorHex) {
    /* eslint-disable-next-line no-param-reassign */
    colorHex = colorHex.replace('#', '');
    const r = parseInt(colorHex.substr(0, 2), 16);
    const g = parseInt(colorHex.substr(2, 2), 16);
    const b = parseInt(colorHex.substr(4, 2), 16);

    return {
        r,
        g,
        b
    };
}

/**
 * Takes a hex color and converts into a base 16 integer
 * @method hexToBase16
 * @param  {String}   colorHex   A hex string in the format of '#FFFFFF', 'FFFFFF', '#FFF', or 'FFF'
 * @return {Interger}            An integer representation of the input
 */
export function hexStringToBase16(colorHex) {
    let formattedHex = colorHex.replace('#', '');

    // Normally a three digit hex value should be evaluated as such,
    // but three digit hex colors are shorthand for their six digit counterparts.
    if (formattedHex.length === 3) {
        // 123 -> 112233
        formattedHex = formattedHex
            .split('')
            .map((v) => v + v)
            .join('');
    }

    /* eslint-disable-next-line prefer-numeric-literals */
    return parseInt(formattedHex, 16);
}

/**
 * Takes a hex color and generates a color palette.
 * @method generateColorPalette
 * @param  {String}   originalColorHex          A hex string in the format of '#FFFFFF' or 'FFFFFF'
 * @param  {Integer}  colorDifferenceIncrement  A number representing the difference in percent between
 *                                              each color in the palette.
 * @param  {Boolean}  results                   The amount of colors in the returned color palette.
 *                                              palette. If set to true, will return a five-color palette.
 * @return {Array}                              Generated colors lighter and/or darker than the original color.
 *                                              Is sorted from lightest to darkest.
 */
export function generateColorPalette(originalColorHex, colorDifferenceIncrement, results = 3) {
    // If an invalid number is passed in (anything less than 2), return
    // the original color.
    if (results < 2) {
        return [originalColorHex];
    }

    const baseColor = tinycolor(originalColorHex);
    const generatedColors = [];
    // The maximum brightness is 255, so anything above 170 is considered light,
    // anything below 85 is considered dark, and anything between 85 and 170
    // is considered mid-range.
    if (baseColor.getBrightness() > 170) {
        // Calling darken() or lighten() on a tinycolor mutates the original color,
        // so each additional time darken() or lighten() is called, the mutated
        // value must be taken into effect. This is why we only darken the color
        // by the colorDifferenceIncrement each time instead of having to darken
        // the color by the colorDifferenceIncrement * 2 for the darkest shade.
        /* eslint-disable-next-line no-underscore-dangle */
        generatedColors.push(baseColor._originalInput);
        _.range(1, results).forEach(() => {
            generatedColors.push(baseColor.darken(colorDifferenceIncrement).toString());
        });
    } else if (baseColor.getBrightness() < 85) {
        /* eslint-disable-next-line no-underscore-dangle */
        generatedColors.push(baseColor._originalInput);
        _.range(1, results).forEach(() => {
            generatedColors.push(baseColor.lighten(colorDifferenceIncrement).toString());
        });

        // Keep the returned array in order from lightest to darkest.
        generatedColors.reverse();
    } else {
        const middleShadeIndex = Math.ceil(results / 2);
        _.range(1, middleShadeIndex).forEach(() => {
            generatedColors.push(baseColor.lighten(colorDifferenceIncrement).toString());
        });

        // Keep the returned array in order from lightest to darkest.
        generatedColors.reverse();

        // Insert the middle shade at the correct index.
        /* eslint-disable-next-line no-underscore-dangle */
        generatedColors.push(baseColor._originalInput);
        const resetBaseColor = tinycolor(originalColorHex);
        _.range(middleShadeIndex, results).forEach(() => {
            generatedColors.push(resetBaseColor.darken(colorDifferenceIncrement).toString());
        });
    }

    return generatedColors;
}

/**
 * Convert an Imgix query parameter color to a hex color string.
 *
 * 3, 4, 6, and 8 character strings are accepted as input.
 *
 * Examples:
 *   RGB      -> #RGB
 *   ARGB     -> #RGBA
 *   RRGGBB   -> #RRGGBB
 *   AARRGGBB -> #RRGGBBAA
 *
 * @param  {string} imgixColor Imgix color string
 * @return {string}            CSS color string
 */
export const imgixColorToCssColor = (imgixColor) => {
    let cssColor = imgixColor;

    if (cssColor.length === 4) {
        cssColor = `${cssColor.substring(1)}${cssColor.substring(0, 1)}`;
    } else if (cssColor.length === 8) {
        cssColor = `${cssColor.substring(2)}${cssColor.substring(0, 2)}`;
    }

    return `#${cssColor}`;
};

/**
 * Convert a hex color string to an Imgix query parameter color.
 *
 * 4, 5, 7, and 9 character strings are accepted as input (3, 4, 6, and 8 without the # symbol)
 *
 * Examples:
 *   #RGB      -> RGB
 *   #RGBA     -> ARGB
 *   #RRGGBB   -> RRGGBB
 *   #RRGGBBAA -> AARRGGBB
 *
 * @param  {string} hexColor Hex color string
 * @return {string}         Imgix color string
 */
export const cssColorToImgixColor = (cssColor) => {
    let imgixColor = cssColor.substring(1);

    if (imgixColor.length === 4) {
        imgixColor = `${imgixColor.substring(3)}${imgixColor.substring(0, 3)}`;
    } else if (imgixColor.length === 8) {
        imgixColor = `${imgixColor.substring(6)}${imgixColor.substring(0, 6)}`;
    }

    return imgixColor;
};

/**
 * Algorithm to convert an RGB color to the LAB color space, copy/pasted and lightly modified from this stackoverflow answer: https://stackoverflow.com/a/52453462/6179164
 *
 * This is needed because calculating the Delta E between two colors requires converting them to LAB first.
 * I don't fully understand it, but the main highlight is that it more closely maps to the human perception of color.
 *
 * @param {Object} rgb - An object representing a color with r, g, and b properties which we will convert to LAB
 */
function convertRGBToLAB(rgb) {
    let red = rgb.r / 255;
    let green = rgb.g / 255;
    let blue = rgb.b / 255;
    red = red > 0.04045 ? ((red + 0.055) / 1.055) ** 2.4 : red / 12.92;
    green = green > 0.04045 ? ((green + 0.055) / 1.055) ** 2.4 : green / 12.92;
    blue = blue > 0.04045 ? ((blue + 0.055) / 1.055) ** 2.4 : blue / 12.92;

    let x = (red * 0.4124 + green * 0.3576 + blue * 0.1805) / 0.95047;
    let y = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 1.0;
    let z = (red * 0.0193 + green * 0.1192 + blue * 0.9505) / 1.08883;
    x = x > 0.008856 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? z ** (1 / 3) : 7.787 * z + 16 / 116;

    const L = 116 * y - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);

    return {
        L,
        a,
        b
    };
}

/**
 * This algorithm is copy/pasted and very lightly modified from this stackoverflow answer because it's too complicated
 * and somehow nobody has made a library which can handle this competently: https://stackoverflow.com/a/52453462/6179164
 *
 * It calculates the Delta E between two colors, an advanced way of quantifying the human-perceived difference between two colors.
 * Delta E values are on a scale from 0-100, where values can be roughly interpreted like so:
 *    0-1: Difference between the two colors is essentially invisible
 *    1-2: Very small difference, you'd need to look very closely to notice
 *    2-6: Fairly noticeable difference to the untrained eye, but the colors are still quite similar
 *    6-50: The difference is very clear but the colors are still technically more similar than not
 *    50-100: The colors appear more opposite than similar
 *    100: The colors are exact opposites (ie, black and white)
 *
 * @param {Object} rgbA - The first color to compare, as an object with r, g, and b properties for the color's red, green, and blue values.
 * @param {Object} rgbB - The second color to compare, as an object with r, g, and b properties for the color's red, green, and blue values.
 *
 * @returns {number}  The delta E distance between the two colors.
 */
export function getDeltaEForRGBColors(rgbA, rgbB) {
    const labA = convertRGBToLAB(rgbA);
    const labB = convertRGBToLAB(rgbB);

    const deltaL = labA.L - labB.L;
    const deltaA = labA.a - labB.a;
    const deltaB = labA.b - labB.b;

    const c1 = Math.sqrt(labA.a * labA.a + labA.b * labA.b);
    const c2 = Math.sqrt(labB.a * labB.a + labB.b * labB.b);
    const deltaC = c1 - c2;

    const deltaH = Math.sqrt(
        // Clamp negative values to 0 so we can safely get the sqrt
        Math.max(0, deltaA * deltaA + deltaB * deltaB - deltaC * deltaC),
    );

    const sc = 1.0 + 0.045 * c1;
    const sh = 1.0 + 0.015 * c1;

    const deltaLKlsl = deltaL / 1.0;
    const deltaCkcsc = deltaC / sc;
    const deltaHkhsh = deltaH / sh;

    return Math.sqrt(
        // Clamp negative values to 0 so we can safely get the sqrt
        Math.max(0, deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh),
    );
}

/**
 * Calculate the color difference between two hex code colors.
 *
 * @param {string} hexA
 * @param {string} hexB
 */
export function getDeltaEForHexColors(hexA, hexB) {
    return getDeltaEForRGBColors(tinycolor(hexA).toRgb(), tinycolor(hexB).toRgb());
}