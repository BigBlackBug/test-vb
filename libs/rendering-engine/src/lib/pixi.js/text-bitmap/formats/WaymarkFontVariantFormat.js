import Ajv from 'ajv';

import WaymarkFontVariantFormatSchema from './WaymarkFontVariantFormatSchema.json';

/**
 * BitmapFont format that's JSON-based and contains additional font information
 *
 * @class
 * @private
 */
// eslint-disable-next-line import/prefer-default-export
export class WaymarkFontVariantFormat {
    /**
     * Check if resource refers to JSON font data.
     *
     * @static
     * @private
     * @param {any} data the resource's data to load
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
        const validator = ajv.compile(WaymarkFontVariantFormatSchema);
        return validator(JSON.parse(data));
    }

    /**
     * Convert font data to a BitmapFontData object.
     *
     * @static
     * @param {any} data the resource's data to parse
     * @returns {object} Parsed font data
     */
    static parse(data) {
        return JSON.parse(data);
    }
}