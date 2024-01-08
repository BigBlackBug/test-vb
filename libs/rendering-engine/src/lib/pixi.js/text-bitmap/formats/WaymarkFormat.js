import Ajv from 'ajv';

import {
    WMBitmapFontData
} from 'pixi.js';

import waymarkFormatSchema from './WaymarkFormatSchema.json';

/**
 * BitmapFont format that's JSON-based and contains additional font information
 *
 * @class
 * @private
 */
// eslint-disable-next-line import/prefer-default-export
export class WaymarkFormat {
    /**
     * Check if resource refers to JSON font data.
     *
     * @static
     * @private
     * @param {any} data The resource's data to test
     * @returns {boolean} True if resource could be treated as font data, false otherwise.
     */
    static test(data) {
        let testData = data;
        if (typeof data === 'string') {
            testData = JSON.parse(data);
        }
        const ajv = new Ajv({
            allErrors: true,
            useDefaults: true
        });
        const validator = ajv.compile(waymarkFormatSchema);
        const isValid = validator(testData);
        // For debugging: uncomment this line
        // if (!isValid) {console.log(testData, validator.errors)}
        return isValid;
    }

    /**
     * Convert font data to a WMBitmapFontData object.
     *
     * @static
     * @param {any} data the resource's data to load
     * @returns {WMBitmapFontData} Parsed font data
     */
    static parse(data) {
        const bitmapFontData = new WMBitmapFontData();

        // const { family, style, weight, ascender, descender, unitsPerEm } = data.fontProperties;

        bitmapFontData.info = {
            isImageFont: data.meta.isImageFont || false,
            face: data.meta.name,
            size: data.spritesheetProperties.size,
            ascender: data.fontProperties.ascender,
            descender: data.fontProperties.descender,
            unitsPerEm: data.fontProperties.unitsPerEm,
            spritesheetPadding: data.spritesheetProperties.padding,
            weight: data.meta.weight,
            isItalic: data.meta.isItalic,
        };
        bitmapFontData.common = {
            // NOTE: This is something that we just don't end up using at all, beacuse we rely on it from lineHeight
            lineHeight: data.spritesheetProperties.lineHeight,
        };
        bitmapFontData.page = data.spritesheets.map((spritesheet, index) => ({
            id: index,
            file: spritesheet,
        }));
        bitmapFontData.char = data.characters;
        bitmapFontData.kerning = data.kerning;
        bitmapFontData.ligatures = data.ligatures;
        // TODO: This should be an actual unique identifier. We need something unique to cache with this during BitmapFont.install.
        bitmapFontData.uuid = `${data.meta.name}_${data.meta.weight}_${data.meta.isItalic}_${data.meta.generatedOn}`

        return bitmapFontData;
    }
}