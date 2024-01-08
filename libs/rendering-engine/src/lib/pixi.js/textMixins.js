/* eslint-disable no-param-reassign, no-underscore-dangle, func-names */
import {
    Point,
    TextStyle
} from 'pixi.js';
import {
    TextAnimator
} from '../pixi-text-animator/index.js';

// For detecting any Hebrew, Arabic, and characters for switching text direction
const rtlRegex = new RegExp('[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]', 'ig');
// For detecting any Bhramic characters, which can't be rendered with letterspacing due to
// diacritic characters (ex: Virama/Halant ्) getting rendered when not using default browser rendering
// See: https://en.wikipedia.org/wiki/Virama
// See: https://en.wikipedia.org/wiki/Diacritic
const bhramicRegex = new RegExp('[\u0900-\u0E7F\uA980—\uA9DF\u1B00—\u1B7F]', 'ig');

// Shared Getters and Setters with the Text and BitmapText
export const textMixins = {
    // An internally-used padding that gets multiplied by the font-size to generate an
    // apropriate padding so the text isn't cut off on rendering.
    // This number is arbritrary and was determined by what "looks good" for the fonts we had trouble with
    FONT_SIZE_PADDING_FACTOR: 0.25,
    // We currently have an idea of boxHeight but not boxWidth when it comes to text metrics.
    // For some reason, it is possible for wordWrapWidth to be unattainable for a Bitmap Font's
    // given text size. Therefore, when applying a resize strategy we'll see if the width of the rendered
    // text box is within (style.wordWrapWidth * WORD_WRAP_WIDTH_PADDING_FACTOR). Replacing this fudge factor
    // by determining what the width measurement differences are in AE vs. our Bitmap Fonts is probably the better
    // fix. This works for now.
    WORD_WRAP_WIDTH_PADDING_FACTOR: 1.02,

    /**
     * Resizing strategy for stepAndBreakWords, returns a resized TextStyle object
     *
     * @returns {TextStyle} The sized TextStyle object
     */
    resizeTextStyleForStepAndBreakWords() {
        const currentStyle = this._style;
        // Clone the style so we can modify it without affecting the original
        const resizedStyle = this._style.clone();

        // Set breakWords to false so we can see what the width is without broken words,
        // this way the text will as much as it possibly can before breaking into separate lines
        // Note: Directly setting each of these TextStyle values so we don't force a change in the styleID
        resizedStyle._breakWords = false;

        // Grab this value because it is generated (and will change each loop) if it hasn't been set.
        const sizeOptions = resizedStyle.fontSizeOptions;

        // Loop through our font size options, testing each one to find the best size
        for (let index = 0; index <= sizeOptions.length - 1; index += 1) {
            const fontSize = sizeOptions[index];
            resizedStyle._fontSize = fontSize;

            // The line height should change proportionally to the changed font size
            const proportionalChange = fontSize / currentStyle.fontSize;
            resizedStyle._lineHeight = currentStyle.lineHeight * proportionalChange;

            // PIXI expects `letterSpacing` in pixels, so we also need to adjust it proportionally.
            resizedStyle._letterSpacing = currentStyle.letterSpacing * proportionalChange;

            // Measure the text
            if (!this.measureText) {
                console.warn(
                    'Classes implementing resizeTextStyleForStepAndBreakWords need to provide a custom measureText method',
                );
            }
            const measuredText = this.measureText(this.text, resizedStyle);

            if (
                measuredText.maxLineWidth <=
                resizedStyle.wordWrapWidth * this.WORD_WRAP_WIDTH_PADDING_FACTOR &&
                // We use boxHeight here because it's closer to the After Effect manner of determining if text overflows the box
                // For example: We don't care about the accents on the first line, or the descenders on the last line
                // That way, if an After Effects project contains paragraph text that fully contains some 64px text,
                // the resizing strategy isn't at risk of modifying that same text's size on render.
                measuredText.boxHeight <= resizedStyle.wordWrapHeight &&
                !measuredText.hasTextOverflowed
            ) {
                break;
            }
        }

        // Reset breakWords back to true so words will break if they flow over the bounds
        resizedStyle._breakWords = true;

        return resizedStyle;
    },

    /**
     * A logged property to record what the style of the text was when it was rendered.
     * Used in positioning and calculating bounds.
     *
     * @returns {TextStyle} The TextStyle as rendered
     */
    get renderedTextStyle() {
        if (this._renderedTextStyle === undefined) {
            return this._style;
        }
        return this._renderedTextStyle;
    },
    set renderedTextStyle(renderedTextStyle) {
        this._renderedTextStyle = renderedTextStyle;
    },

    // The adjustment to the X axis anchor point, given the text's alignment (left is default)
    HORZONTAL_ALIGN_ANCHOR_ADJUSTMENTS: {
        left: 0,
        center: 0.5,
        right: 1,
    },

    // The adjustment to the Y axis anchor point, given the text's alignment (top is default)
    VERTICAL_ALIGN_ANCHOR_ADJUSTMENTS: {
        top: 0,
        center: 0.5,
        // Included as an alias for `center`
        middle: 0.5,
        bottom: 1,
    },

    /**
     * A computed value that changes the anchor of the text based on the style and custom WaymarkAuthorWebRenderer properties
     *
     * @param {number} textWidth The size of the text in pixels
     * @param {number} textHeight The size of the text in pixels
     *
     * @returns {Point} A x/y value to adjust the anchoring of the text
     */
    getAnchorAdjustment(textWidth, textHeight) {
        let textBoxPositionXAdjustment = 0;
        let textBoxPositionYAdjustment = 0;

        if (!this.measureText) {
            console.warn(
                'Classes implementing anchorAdjustment need to provide a custom measureText method',
            );
        }
        const textMetrics = this.measureText(this.text, this.renderedTextStyle);
        const textBoxHorizontalAlignAdjustment =
            this.HORZONTAL_ALIGN_ANCHOR_ADJUSTMENTS[this.renderedTextStyle.align];
        const textBoxVerticalAlignAdjustment =
            this.VERTICAL_ALIGN_ANCHOR_ADJUSTMENTS[this.renderedTextStyle.alignVertical];

        if (this.renderedTextStyle.isTextBox) {
            /**
             * Text box alignment is a little tricky:
             * The anchor position is based off of a (negative) distance to the top left position of the text box.
             * We calulate the unitless position from by taking the distance divided by the width of text.
             * With center and right text alignment we subtract half, and the full difference in box sizes respectively
             */
            if (textWidth) {
                textBoxPositionXAdjustment =
                    (-this.renderedTextStyle.textBoxPosition.x -
                        (this.renderedTextStyle.wordWrapWidth - textWidth) * textBoxHorizontalAlignAdjustment) /
                    textWidth;
            } else {
                textBoxPositionXAdjustment = 0;
            }

            /**
             * Like the X adjustment, the Y adjustment is based off of the measurement to the top left of the text box.
             * Because the top position of the text box is based off of the height of the first & last lines (with or without ascenders & descenders)
             * we need to offset the position slightly because PixiJS will draw the text line assuming there is an ascender or descender.
             */
            if (textHeight) {
                textBoxPositionYAdjustment =
                    (-this.renderedTextStyle.textBoxPosition.y +
                        (textMetrics.fontProperties.ascenderHeight -
                            textMetrics.fontProperties.overshootHeight) -
                        (this.renderedTextStyle.wordWrapHeight - textMetrics.boxHeight) *
                        textBoxVerticalAlignAdjustment) /
                    textHeight;
            } else {
                textBoxPositionYAdjustment = 0;
            }
        } else {
            textBoxPositionXAdjustment = textBoxHorizontalAlignAdjustment;
            if (textMetrics.lineBounds && textMetrics.lineBounds.length) {
                /**
                 * Text positioning on text lines (not text boxes) with Bitmap text is complicated by the fact that the text is not drawn against a baseline
                 */

                const [firstLine] = textMetrics.lineBounds;
                textBoxPositionYAdjustment =
                    textMetrics.fontProperties.ascent /
                    (textHeight - (textMetrics.fontProperties.ascent - Math.abs(firstLine.y)));
            } else {
                /**
                 * The ascent ratio is the distance from the top to the text baseline, divided by the total height
                 * This is the "origin" of the text drawing, as exported by bodymovin. Currently PixiJS still considers
                 * the center to be in the middle of the height, instead of this origin, so we offset it using the ascent ratio
                 */
                textBoxPositionYAdjustment = textMetrics.fontProperties.ascent / textHeight;
            }
        }

        return new Point(textBoxPositionXAdjustment, textBoxPositionYAdjustment);
    },

    /**
     * A computed value that changes the anchor of the text based on the style and custom WaymarkAuthorWebRenderer properties
     *
     * NOTE:
     * getTextAnchorAdjustment
     * Gets the anchor adjustment for this particular Text Class. BitmapText and Text both use different measurements
     * to determine the overall text width, so they should implement this function in a way like this:
     *
     *  getTextAnchorAdjustment() {
     *    return this.getAnchorAdjustment(this.textWidth, this.textHeight)
     *  }
     *
     * @returns {Point} the x/y anchor adjustment
     */
    get anchorAdjustment() {
        if (this._anchorAdjustment === undefined) {
            this._anchorAdjustment = new Point();
        }

        if (
            this.localStyleID !== this._anchorAdjustmentStyleID ||
            this.text !== this._anchorAdjustmentText
        ) {
            if (!this.getTextAnchorAdjustment) {
                console.warn(
                    'Classes implementing anchorAdjustment need to provide a custom getTextAnchorAdjustment method',
                );
            }
            // If the text or style has updated, refresh the anchor adjustment
            this._anchorAdjustment.copyFrom(this.getTextAnchorAdjustment());
            this._anchorAdjustmentText = this.text;
            this._anchorAdjustmentStyleID = this.localStyleID;
        }

        return this._anchorAdjustment;
    },
    set anchorAdjustment(adjustment) {
        // anchorAdjustment is computed from getAnchorAdjustment and only updated when the text or style is updated
        console.warn('anchorAdjustment is not settable');
    },

    /**
     * The store of animators for a Text object
     *
     * @returns {TextAnimator[]} An array of text animator objects
     */
    get animators() {
        if (this._animators === undefined) {
            this._animators = [];
        }
        return this._animators;
    },
    set animators(animators) {
        this._animators = animators;
    },

    /**
     * Render the text with letter-spacing.
     *
     * @param {string} text - The text to draw
     * @param {number} x - Horizontal position to draw the text
     * @param {number} y - Vertical position to draw the text
     * @param {boolean} [isStroke=false] - Is this drawing for the outside stroke of the
     *  text? If not, it's for the inside fill
     * @private
     */
    drawLetterSpacing(text, x, y, isStroke = false) {
        const style = this._style;
        // letterSpacing of 0 means normal
        const {
            letterSpacing
        } = style;
        // CHANGED LINES:
        // Ignore letterspacing when RTL characters are present
        const hasRTLCharacters = rtlRegex.test(text);
        const hasBhramicCharacters = bhramicRegex.test(text);
        if (letterSpacing === 0 || hasRTLCharacters || hasBhramicCharacters) {
            // END CHANGED LINES
            if (isStroke) {
                this.context.strokeText(text, x, y);
            } else {
                this.context.fillText(text, x, y);
            }
            return;
        }
        let currentPosition = x;
        // Using Array.from correctly splits characters whilst keeping emoji together.
        // This is not supported on IE as it requires ES6, so regular text splitting occurs.
        // This also doesn't account for emoji that are multiple emoji put together to make something else.
        // Handling all of this would require a big library itself.
        // https://medium.com/@giltayar/iterating-over-emoji-characters-the-es6-way-f06e4589516
        // https://github.com/orling/grapheme-splitter
        const stringArray = Array.from ? Array.from(text) : text.split('');
        let previousWidth = this.context.measureText(text).width;
        let currentWidth = 0;
        for (let i = 0; i < stringArray.length; i += 1) {
            const currentChar = stringArray[i];
            if (isStroke) {
                this.context.strokeText(currentChar, currentPosition, y);
            } else {
                this.context.fillText(currentChar, currentPosition, y);
            }

            currentWidth = this.context.measureText(text.substring(i + 1)).width;
            currentPosition += previousWidth - currentWidth + letterSpacing;
            previousWidth = currentWidth;
        }
    },
};

export const modifyUpdateText = (textClass) => {
    const originalUpdateText = textClass.prototype.updateText;

    // @dangerousMonkeyPatch
    const updateText = function(respectDirty) {
        const originalTextStyle = this._style;

        if (!originalTextStyle) {
            return;
        }

        // check if style has changed..
        if (this.localStyleID !== originalTextStyle.styleID) {
            this.dirty = true;
            this.localStyleID = originalTextStyle.styleID;
        }

        if (!this.dirty && respectDirty) {
            return;
        }

        // Update the style
        let renderedTextStyle = this._style;

        // Resize the text if it fits one of our text resizing strategies
        if (
            this._style.isTextBox &&
            this._style.resizingStrategy === TextStyle.TEXT_RESIZING_STRATEGIES.stepAndBreakWords
        ) {
            renderedTextStyle = this.resizeTextStyleForStepAndBreakWords();
        }

        this._style = renderedTextStyle;
        this.renderedTextStyle = renderedTextStyle;

        // Occasionally some fonts are cropped because of bad font measurement/placement by canvas
        // drawing methods. Adding some padding will prevent this from happening by adding padding to all sides of the text.
        renderedTextStyle.padding =
            renderedTextStyle.fontSize * textClass.prototype.FONT_SIZE_PADDING_FACTOR;

        // Draw the text as normal, but with the selected rendered TextStyle
        originalUpdateText.call(this, respectDirty);

        /**
         * Because we redrew the text object as part of this, we want to also force an update to the anchorAdjustment
         * This is because texture drawn at various resolutions might not be exactly proportional, and result in rounding
         * differences at various resolutions.
         *
         * For example:
         *   We might have a texture drawn at 46px wide @ a resolution of 1 giving us a frame width of 46
         *   That text drawn at 71px wide @ a resolution of 1.5 would give us a frame width of 48 (due to ceiling rounding)
         *
         * To solve this, we force a recalculation of the anchor adjustment by clearing the cached _anchorAdjustmentStyleID
         */
        this._anchorAdjustmentStyleID = null;
        /**
         * When the text anchor is updated, calculate the anchor property based
         * on adjustments due to the content and styling.
         *
         * Anchor points are exported as pixel values relative to the origin of the object
         * PixiJS instead wants anchor points as unitless values in relation to the object's width and height.
         * ex: [.5, .5] is the origin of the object, [1, 1] is the bottom right.
         */
        this.anchor.set(this.anchorAdjustment.x, this.anchorAdjustment.y);

        // Return the style to its original state, but with an updated styleID
        originalTextStyle.styleID = renderedTextStyle.styleID;
        this._style = originalTextStyle;
    };

    textClass.prototype.updateText = updateText;
};