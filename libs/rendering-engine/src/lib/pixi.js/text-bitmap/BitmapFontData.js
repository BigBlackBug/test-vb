/* eslint-disable max-len, no-param-reassign, jsdoc/no-undefined-types, jsdoc/check-tag-names, jsdoc/require-property-description  */

/**
 * @param {object} pixiNamespace The Pixi export that we will be modifying
 */
export default function enableBitmapFontData(pixiNamespace) {
    /**
     * Normalized parsed data from .fnt files.
     *
     * @class
     * @memberof PIXI
     */
    // eslint-disable-next-line import/prefer-default-export
    class BitmapFontData {
        constructor() {
            /**
             * @member {PIXI.IBitmapFontDataInfo[]}
             * @readOnly
             */
            this.info = {};

            /**
             * @member {PIXI.IBitmapFontDataCommon[]}
             * @readOnly
             */
            this.common = {};

            /**
             * @member {PIXI.IBitmapFontDataPage[]}
             * @readOnly
             */
            this.page = [];

            /**
             * @member {PIXI.IBitmapFontDataChar[]}
             * @readOnly
             */
            this.char = [];

            /**
             * @member {PIXI.IBitmapFontDataKerning[]}
             * @readOnly
             */
            this.kerning = [];
        }
    }

    /**
     * @memberof PIXI
     * @typedef {object} IBitmapFontDataInfo
     * @property {string} face
     * @property {number} size
     */

    /**
     * @memberof PIXI
     * @typedef {object} IBitmapFontDataCommon
     * @property {number} lineHeight
     */

    /**
     * @memberof PIXI
     * @typedef {object} IBitmapFontDataPage
     * @property {number} id
     * @property {string} file
     */

    /**
     * @memberof PIXI
     * @typedef {object} IBitmapFontDataChar
     * @property {number|string} id
     * @property {number} glyphId
     * @property {number} page
     * @property {number} x
     * @property {number} y
     * @property {number} width
     * @property {number} height
     * @property {number} xoffset
     * @property {number} yoffset
     * @property {number} xadvance
     */

    /**
     * @memberof PIXI
     * @typedef {object} IBitmapFontDataKerning
     * @property {number} first
     * @property {number} second
     * @property {number} amount
     */

    pixiNamespace.WMBitmapFontData = BitmapFontData;
}