import Ajv from 'ajv';

import WaymarkFallbackFontFormatSchema from './WaymarkFallbackFontFormatSchema.json';

/**
 * BitmapFont format that's JSON-based and contains additional font information
 *
 * @class
 * @private
 */
// eslint-disable-next-line import/prefer-default-export
export class WaymarkFallbackFontFormat {
    /**
     * Check if resource refers to JSON font data.
     *
     * @static
     * @private
     * @param {any} data
     * @returns {boolean} True if resource could be treated as font data, false otherwise.
     */
    static test(data) {
        if (typeof data !== 'string') {
            return false;
        }
        const ajv = new Ajv({
            allErrors: true,
            useDefaults: true
        });
        const validator = ajv.compile(WaymarkFallbackFontFormatSchema);
        return validator(JSON.parse(data));
    }

    /**
     * Convert font data to a WMBitmapFontData object.
     *
     * @static
     * @param data
     * @private
     * @param {object}
     * @returns {PIXI.WMBitmapFontData} Parsed font data
     */
    static parse(data) {
        return JSON.parse(data);
    }
}