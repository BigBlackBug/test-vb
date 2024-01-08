import {
    WaymarkFormat
} from './WaymarkFormat.js';
import {
    WaymarkFallbackFontFormat
} from './WaymarkFallbackFontFormat.js';
import {
    WaymarkFontVariantFormat
} from './WaymarkFontVariantFormat.js';

// Registered formats, maybe make this extensible in the future?
const formats = [WaymarkFormat, WaymarkFallbackFontFormat, WaymarkFontVariantFormat];

/**
 * Auto-detect BitmapFont parsing format based on data.
 *
 * @private
 * @param {any} data - Data to detect format
 * @returns {any} Format or null
 */
// eslint-disable-next-line import/prefer-default-export
export function autoDetectFormat(data) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < formats.length; i++) {
        if (formats[i].test(data)) {
            return formats[i];
        }
    }

    return null;
}

export {
    WaymarkFormat
};
export {
    WaymarkFallbackFontFormat
};
export {
    WaymarkFontVariantFormat
};