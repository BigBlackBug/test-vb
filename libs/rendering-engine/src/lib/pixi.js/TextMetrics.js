import _ from 'lodash';
import {
    maxCanvasSize
} from '../../constants.js';

/**
 * Enables the custom properties and methods on PixiJS TextMetrics objects to enable Text Boxes.
 *
 * @param      {object}  pixiNamespace  The pixi namespace
 */
export default function enableTextMetricsTextBox(pixiNamespace) {
    // Cached copy of the TextMetrics' measure font method
    const originalMeasureText = pixiNamespace.TextMetrics.measureText;

    /**
     * Measures the supplied text and style and returns a TextMetrics object with measurement information
     * Extended from PixiJS's TextMetrics
     *
     * @param {string} text - the text to measure.
     * @param {pixiNamespace.TextStyle} style - the text style to use for measuring
     * @param {boolean} [wordWrap] - optional override for if word-wrap should be applied to the text.
     * @param {HTMLCanvasElement} [canvas] - optional specification of the canvas to use for measuring.
     * @returns {pixiNamespace.TextMetrics} measured width and height of the text.
     */
    /* eslint-disable-next-line no-param-reassign */
    // @dangerousMonkeyPatch
    pixiNamespace.TextMetrics.measureText = (text, style, wordWrap, canvas) => {
        const measuredText = originalMeasureText(text, style, wordWrap, canvas);
        // WM: Begin monkeypatch
        // Warning: There could be some Pixi v7 breakage here because there's something called
        // Text.nextLineHeightBehavior. That's something worth investigating if text breakage
        // emerges.
        // Make adjustments to the measured text if the style is a text box
        if (style.isTextBox) {
            // Remove lines that are outside of the text's word wrap height
            let maxLines = Math.floor(style.wordWrapHeight / measuredText.lineHeight);
            // The descent of the font isn't counted towards the total height of the text box in
            // After Effects, so if there's additional space left over, add the last line.
            if (
                measuredText.lineHeight * maxLines + measuredText.fontProperties.capHeight <=
                style.wordWrapHeight
            ) {
                maxLines += 1;
            }

            // A boolean check if we have lines that are present on the text object that don't get rendered because they
            // will stretch outside the bounds of the text box
            measuredText.hasTextOverflowed = maxLines < measuredText.lines.length;
            measuredText.lines = measuredText.lines.slice(0, maxLines);
            measuredText.lineWidths = measuredText.lineWidths.slice(0, maxLines);
            // Reset the maxLineWidth
            measuredText.maxLineWidth = _.max(measuredText.lineWidths);

            // Calculation copied from the original TextMetrics measureText, but recalculated with our new list of lines
            measuredText.width = measuredText.maxLineWidth + style.strokeThickness;
            if (style.dropShadow) {
                measuredText.width += style.dropShadowDistance;
            }

            // Calculation copied from the original TextMetrics measureText, but recalculated with our new line length
            measuredText.height =
                Math.max(
                    measuredText.lineHeight,
                    measuredText.fontProperties.fontSize + style.strokeThickness,
                ) +
                (measuredText.lines.length - 1) * (measuredText.lineHeight + style.leading);

            // The height of the text that we care about in the block (We don't care about the accents on the first line, or the descenders on the last line)
            measuredText.boxHeight =
                measuredText.fontProperties.capHeight +
                measuredText.fontProperties.overshootHeight +
                measuredText.lineHeight * (measuredText.lines.length - 1);

            if (style.dropShadow) {
                measuredText.height += style.dropShadowDistance;
            }
        }

        return measuredText;
        // WM: End monkeypatch
    };

    // Cached copy of the TextMetrics' measure font method
    const originalMeasureFont = pixiNamespace.TextMetrics.measureFont;

    /**
     * Calculates the ascent, descent, fontSize, capHeight, ascenderHeight, and overshootHeight of a given font-style
     * This augment's PixiJS' TextMetrics.js, and is modified to add capHeight, ascenderHeight, and overshootHeight.
     *
     * @static
     * @param {string} font - String representing the style of the font
     * @returns {pixiNamespace.TextMetrics~FontMetrics} Font properties object
     */
    /* eslint-disable-next-line no-param-reassign */
    // @dangerousMonkeyPatch
    pixiNamespace.TextMetrics.measureFont = (font) => {
        const measuredFont = originalMeasureFont(font);

        // WM: Begin monkeypatch
        const fontProperties = pixiNamespace.TextMetrics._fonts[font];

        // as this method is used for preparing assets, don't recalculate things if we don't need to
        if (!_.isUndefined(fontProperties.capHeight) ||
            !_.isUndefined(fontProperties.ascenderHeight) ||
            !_.isUndefined(fontProperties.overshootHeight)
        ) {
            return fontProperties;
        }

        const measuredCapText = pixiNamespace.TextMetrics.measureFontText(
            font,
            pixiNamespace.TextMetrics.BASELINE_SYMBOL,
        );

        // The Cap Height is the height of a Capital Letter without ascenders or desenders.
        // We make the assumption that the baseline charater, M, is a good example of this.
        fontProperties.capHeight = measuredCapText.ascent;
        // The Ascender Height is the height of font from the Cap Height to the tallest ascender
        fontProperties.ascenderHeight = measuredFont.ascent - fontProperties.capHeight;

        const {
            ascent,
            descent
        } = pixiNamespace.TextMetrics.measureFontText(
            font,
            pixiNamespace.TextMetrics.ALPHANUMERIC_STRING,
        );

        // The overshoot height is the distance a rounded or pointed character (like O, A, l) extends higher (or lower) than a comparably sized "flat" letter (X, H, M).
        fontProperties.overshootHeight = ascent - fontProperties.capHeight;

        // If our measurement with the ALPHANUMERIC_STRING shows that we actually have a larger
        // font, update the properties
        if (descent > fontProperties.descent) {
            fontProperties.descent = descent;
        }
        if (ascent > fontProperties.ascent) {
            fontProperties.ascent = ascent;
        }

        // Update the total font size
        fontProperties.fontSize = fontProperties.descent + fontProperties.ascent;

        return fontProperties;
        // WM: End monkeypatch
    };

    /**
     * A method to measure text of a given font and return the ascent and descent.
     * This is ripped from PixiJS' TextMetrics.js, and modified to accept any text.
     * Unlike the PixiJS version, this does not save the measured font to the cached fonts array, otherwise it is almost identical.
     *
     * @param      {string}  font    The font string used to set a 2d canvas context's font
     * @param      {string}  text    The text to measure
     * @returns     {object}          Object containing the ascent (height of text above the baseline),
     *                               descent (height of text below the baseline),
     *                               totalHeight (combination of the two),
     *                               and width (the width of the text)
     */
    /* eslint-disable-next-line no-param-reassign */
    pixiNamespace.TextMetrics.measureFontText = (font, text) => {
        const properties = {};

        /* eslint-disable-next-line no-underscore-dangle */
        const canvas = pixiNamespace.TextMetrics._canvas;
        /* eslint-disable-next-line no-underscore-dangle */
        const context = pixiNamespace.TextMetrics._context;

        context.font = font;

        // Modified from the PixiJS version to use any text string
        const width = Math.ceil(context.measureText(text).width);
        properties.width = width;
        let baseline = Math.ceil(context.measureText(pixiNamespace.TextMetrics.BASELINE_SYMBOL).width);
        const height = 2 * baseline;

        baseline = baseline * pixiNamespace.TextMetrics.BASELINE_MULTIPLIER || 0;

        // Due to a bug in Chrome, performing operations on a canvas that is larger than the allowable size will cause a context loss in other webgl contexts
        // https://bugs.chromium.org/p/chromium/issues/detail?id=1013594
        //
        // This is not a perfect solution, as the max canvas size can change across devices and platforms, but this is our best guess as to a maximum size.
        // When this chrome bug is resolved, we can remove this size check.
        //
        // This may result in some slight innacuracies in text sizing measurements, but it will not crash the template at least
        canvas.width = Math.min(width, maxCanvasSize);
        canvas.height = Math.min(height, maxCanvasSize);

        context.fillStyle = '#f00';
        context.fillRect(0, 0, width, height);

        context.font = font;

        context.textBaseline = 'alphabetic';
        context.fillStyle = '#000';
        // Modified from the PixiJS version to use any text string
        context.fillText(text, 0, baseline);

        const imagedata = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const pixels = imagedata.length;
        const line = canvas.width * 4;

        let i = 0;
        let idx = 0;
        let stop = false;

        // ascent. scan from top to bottom until we find a non red pixel
        for (i = 0; i < baseline; i += 1) {
            for (let j = 0; j < line; j += 4) {
                if (imagedata[idx + j] !== 255) {
                    stop = true;
                    break;
                }
            }
            if (!stop) {
                idx += line;
            } else {
                break;
            }
        }

        properties.ascent = baseline - i;

        idx = pixels - line;
        stop = false;

        // descent. scan from bottom to top until we find a non red pixel
        for (i = canvas.height; i > baseline; i -= 1) {
            for (let j = 0; j < line; j += 4) {
                if (imagedata[idx + j] !== 255) {
                    stop = true;
                    break;
                }
            }

            if (!stop) {
                idx -= line;
            } else {
                break;
            }
        }

        properties.descent = i - baseline;

        // Modified from the PixiJS version to use the "totalHeight" key name instead of "fontSize"
        properties.totalHeight = properties.ascent + properties.descent;

        return properties;
    };

    /**
     * String of alphanumeric characters (without accents) that can be used to determine a text's offset
     * Sorted to have the most important characters at the beginning in case the measurement canvas is cut off
     *
     * @static
     * @memberof pixiNamespace.TextMetrics
     * @name METRICS_STRING
     * @type {string}
     */
    /* eslint-disable-next-line no-param-reassign */
    pixiNamespace.TextMetrics.ALPHANUMERIC_STRING =
        'Mjmgqyitl09AaBbCcDdEeFfGgHhIJKkLNnOoPpQRrSsTUuVvWwXxYZz12345678';
}