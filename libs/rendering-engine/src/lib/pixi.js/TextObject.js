import {
    textMixins,
    modifyUpdateText
} from './textMixins.js';

/**
 * Enables the custom properties and methods on PixiJS TextStyle objects.
 *
 * @param      {object}  pixiNamespace  The pixi namespace
 */
export default function enableTextProperties(pixiNamespace) {
    pixiNamespace.Text.mixin(textMixins);
    modifyUpdateText(pixiNamespace.Text);

    // eslint-disable-next-line no-param-reassign, func-names
    pixiNamespace.Text.prototype.getTextAnchorAdjustment = function() {
        return this.getAnchorAdjustment(this.texture.width, this.texture.height);
    };

    // eslint-disable-next-line no-param-reassign, func-names
    // @dangerousMonkeyPatch
    pixiNamespace.Text.prototype.measureText = function(text, style) {
        return pixiNamespace.TextMetrics.measureText(text, style);
    };
}