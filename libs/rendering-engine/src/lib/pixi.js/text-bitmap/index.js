/* eslint-disable no-param-reassign */

import enableWMBitmapText from './BitmapText.js';
import enableBitmapTextMetrics from './BitmapTextMetrics.js';
import enableBitmapFontLoader from './BitmapFontLoader.js';
import enableBitmapFallbackFontLoader from './BitmapFallbackFontLoader.js';
import enableBitmapFallbackFontCollection from './BitmapFallbackFontCollection.js';
import enableBitmapFontVariantLoader from './BitmapFontVariantLoader.js';
import enableBitmapFont from './BitmapFont.js';
import enableBitmapFontData from './BitmapFontData.js';

/**
 * @param {object} pixiNamespace The Pixi export that we will be modifying
 */
export default function enableBitmapText(pixiNamespace) {
    // WMBitmapText
    enableWMBitmapText(pixiNamespace);
    // WMBitmapFontLoader
    enableBitmapFontLoader(pixiNamespace);
    enableBitmapFontVariantLoader(pixiNamespace);
    enableBitmapFallbackFontLoader(pixiNamespace);
    enableBitmapFallbackFontCollection(pixiNamespace);
    enableBitmapTextMetrics(pixiNamespace);
    enableBitmapFont(pixiNamespace);
    enableBitmapFontData(pixiNamespace);
}