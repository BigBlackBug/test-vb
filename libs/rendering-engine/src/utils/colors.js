/**
 * Takes an array of colors exported by bodymovin and convert them to an rgb string.
 * The array will have values from 0-1 that need to be converted to 0-255
 * Alpha isn't used
 *
 * @param      {array}  rgbaArray  The rgb array in the format [r, g, b, (a)]
 * @return     {string}           A string in the format: 'rgb(r, g, b)' || 'rgba(r, g, b, a)'
 */
export function parseColorArray(rgbaArray) {
    // Should we be using round??
    const red = Math.round(rgbaArray[0] * 255);
    const green = Math.round(rgbaArray[1] * 255);
    const blue = Math.round(rgbaArray[2] * 255);

    if (rgbaArray.length === 4) {
        const alpha = rgbaArray[3];
        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    return `rgb(${red}, ${green}, ${blue})`;
}

/**
 * The following section is pulled from GSAP's PixiPlugin: https://github.com/greensock/GSAP/blob/2.1.3/src/uncompressed/plugins/PixiPlugin.js
 */
/* eslint-disable */
const COLOR_LOOKUP = {
    aqua: [0, 255, 255],
    lime: [0, 255, 0],
    silver: [192, 192, 192],
    black: [0, 0, 0],
    maroon: [128, 0, 0],
    teal: [0, 128, 128],
    blue: [0, 0, 255],
    navy: [0, 0, 128],
    white: [255, 255, 255],
    fuchsia: [255, 0, 255],
    olive: [128, 128, 0],
    yellow: [255, 255, 0],
    orange: [255, 165, 0],
    gray: [128, 128, 128],
    purple: [128, 0, 128],
    green: [0, 128, 0],
    red: [255, 0, 0],
    pink: [255, 192, 203],
    cyan: [0, 255, 255],
    transparent: [255, 255, 255, 0],
};

// Modified from GSAP: https://github.com/greensock/GSAP/blob/2.1.3/src/uncompressed/plugins/PixiPlugin.js
const hue = function(h, m1, m2) {
    h = h < 0 ? h + 1 : h > 1 ? h - 1 : h;
    return (
        ((h * 6 < 1 ?
                m1 + (m2 - m1) * h * 6 :
                h < 0.5 ?
                m2 :
                h * 3 < 2 ?
                m1 + (m2 - m1) * (2 / 3 - h) * 6 :
                m1) *
            255 +
            0.5) |
        0
    );
};

const numRegExp = /(\d|\.)+/g;

/**
 * Parses a color (like #9F0, #FF9900, rgb(255,51,153) or hsl(108, 50%, 10%)) into a PIXI-approved
 * hexidecimal (base 16) number.
 *
 * Modified from GSAP: https://github.com/greensock/GSAP/blob/2.1.3/src/uncompressed/plugins/PixiPlugin.js
 *
 * @param  {string} rgbString
 * @returns {number}  Hexadeximal number.
 */
export function rbgStringToNumber(v) {
    let a, r, g, b, h, s, l, max, min, d, wasHSL;
    if (!v) {
        a = COLOR_LOOKUP.black;
    } else if (typeof v === 'number') {
        a = [v >> 16, (v >> 8) & 255, v & 255];
    } else {
        if (v.charAt(v.length - 1) === ',') {
            // sometimes a trailing comma is included and we should chop it off (typically from a comma-delimited list of values like a textShadow:"2px 2px 2px blue, 5px 5px 5px rgb(255,0,0)" - in this example "blue," has a trailing comma. We could strip it out inside parseComplex() but we'd need to do it to the beginning and ending values plus it wouldn't provide protection from other potential scenarios like if the user passes in a similar value.
            v = v.substr(0, v.length - 1);
        }
        if (COLOR_LOOKUP[v]) {
            a = COLOR_LOOKUP[v];
        } else if (v.charAt(0) === '#') {
            if (v.length === 4) {
                // for shorthand like #9F0
                r = v.charAt(1);
                g = v.charAt(2);
                b = v.charAt(3);
                v = `#${r}${r}${g}${g}${b}${b}`;
            }
            v = parseInt(v.substr(1), 16);
            a = [v >> 16, (v >> 8) & 255, v & 255];
        } else if (v.substr(0, 3) === 'hsl') {
            a = wasHSL = v.match(numRegExp);
            h = (Number(a[0]) % 360) / 360;
            s = Number(a[1]) / 100;
            l = Number(a[2]) / 100;
            g = l <= 0.5 ? l * (s + 1) : l + s - l * s;
            r = l * 2 - g;
            if (a.length > 3) {
                a[3] = Number(v[3]);
            }
            a[0] = hue(h + 1 / 3, r, g);
            a[1] = hue(h, r, g);
            a[2] = hue(h - 1 / 3, r, g);
        } else {
            a = v.match(numRegExp) || COLOR_LOOKUP.transparent;
        }
        a[0] = Number(a[0]);
        a[1] = Number(a[1]);
        a[2] = Number(a[2]);
        if (a.length > 3) {
            a[3] = Number(a[3]);
        }
    }
    return (a[0] << 16) | (a[1] << 8) | a[2];
}
/* eslint-enable */

/**
 * A helper method that can be added used as a transform function for applyProperty or applyTween
 *
 * @param      {array}  rgbaArray  The rgba array
 * @return     {array}  The parsed and transformed color value
 */
export function transformColorArray(rgbaArray) {
    return rbgStringToNumber(parseColorArray(rgbaArray));
}

/**
 * Convert hex value to RGB string.
 * Input hex is expected to be an unquoted hex constant
 * or it's decimal representation.
 *
 * Example calls that convert #FF0000 to 'rgb(255, 0, 0)':
 * const rgbString = hexToRGBString(0xff0000);
 * const rgbString = hexToRGBString(16711680);
 *
 * @param   {number}  hex  Hexadecimal number
 * @return  {string}       RGB string
 */
export function hexToRGBString(hex) {
    // From https://stackoverflow.com/a/29241510
    const red = Math.floor(hex / (256 * 256));
    const green = Math.floor(hex / 256) % 256;
    const blue = hex % 256;

    return `rgb(${red}, ${green}, ${blue})`;
}

/**
 * Convert hex value to a float color array (n >= 0.0 && n <= 1.0).
 * Input hex is expected to be an unquoted hex constant
 * or it's decimal representation.
 *
 * @param   {number}   hex  Hexadecimal number
 * @return  {[float]}       Array of 0.0 <= n <= 1.0 floating point RGB values
 */
export function hexToColorArray(hex) {
    // From https://stackoverflow.com/a/29241510
    const red = Math.floor(hex / (256 * 256));
    const green = Math.floor(hex / 256) % 256;
    const blue = hex % 256;

    const colorArray = [red, green, blue].map((color) => color / 255);

    return colorArray;
}

/**
 * Converts a hex color string (typically for imgix values) into a float color array (n >= 0.0 && n <= 1.0).
 * Supports:  3- (RGB) ex. #A0F
 *            6- (RRGGBB) ex. #AA00FF
 *            8-digit (RRGGBBAA) ex. #AA00FFFF
 *
 * @param      {String}  hexString  The hexadecimal string
 * @return  {[float]}       Array of 0.0 <= n <= 1.0 floating point [R,G,B,A] values
 */
export function hexStringToColorArray(hexString) {
    let hex = hexString;
    // If not specified, alpha is 1 (fully opaque)
    let alpha = 1.0;

    // Remove our leading "#"" if one exists
    if (hex.charAt(0) === '#') {
        hex = hex.substring(1);
    }

    // 3- (RGB) ex. #A0F
    if (hex.length === 3) {
        hex = [hex[0], hex[0], hex[1], hex[1], hex[2], hex[2]].join('');
        // 8-digit (RRGGBBAA) ex. #AA00FFFF
    } else if (hex.length === 8) {
        // Convert the alpha into a hex, and then into a 0 -> 1.0 float
        alpha = (parseInt(hex.substring(6, 8), 16) % 256) / 255;
        hex = hex.substring(0, 6);
    }

    const colorArray = hexToColorArray(parseInt(hex, 16));

    // Add the alpha to the end of the array
    colorArray.push(alpha);

    return colorArray;
}