/* eslint-disable no-param-reassign, no-underscore-dangle, func-names, jsdoc/no-undefined-types */

import _ from 'lodash';

import {
    deepCopyProperties
} from '../../utils/index.js';

export const textResizingStrategies = {
    default: 'default',
    stepAndBreakWords: 'stepAndBreakWords',
};

export const stepAndBreakWordsDirections = {
    up: 'up',
    down: 'down',
};

export const defaultStepAndBreakWordsOptions = {
    stepDirection: [stepAndBreakWordsDirections.up, stepAndBreakWordsDirections.down],
};

/**
 * Enables the custom properties and methods on PixiJS TextStyle objects.
 *
 * @param      {object}  pixiNamespace  The pixi namespace
 */
export default function enableTextStyleProperties(pixiNamespace) {
    pixiNamespace.TextStyle.TEXT_RESIZING_STRATEGIES = textResizingStrategies;
    pixiNamespace.TextStyle.DEFAULT_STEP_AND_BREAK_WORDS_OPTIONS = defaultStepAndBreakWordsOptions;
    pixiNamespace.TextStyle.STEP_AND_BREAK_WORDS_DIRECTIONS = stepAndBreakWordsDirections;

    /**
     * Default style ripped from 'pixi.js/lib/core/text/TextStyle.js'
     * Modified to include our custom style properties
     */
    pixiNamespace.TextStyle.DEFAULT_STYLE = {
        align: 'left',
        alignVertical: 'top',
        breakWords: true,
        dropShadow: false,
        dropShadowAlpha: 1,
        dropShadowAngle: Math.PI / 6,
        dropShadowBlur: 0,
        dropShadowColor: 'black',
        dropShadowDistance: 5,
        fill: 'black',
        fillGradientStops: [],
        fillGradientType: pixiNamespace.TEXT_GRADIENT.LINEAR_VERTICAL,
        fontFamily: 'Arial',
        fontSize: 26,
        fontStyle: 'normal',
        fontVariant: 'normal',
        fontWeight: 'normal',
        leading: 0,
        letterSpacing: 0,
        lineHeight: 0,
        lineJoin: 'miter',
        miterLimit: 10,
        padding: 0,
        resizingStrategy: textResizingStrategies.default,
        resizingStrategyOptions: {},
        stroke: 'black',
        strokeThickness: 0,
        styleID: 0,
        textBaseline: 'alphabetic',
        textBoxPosition: {
            x: 0,
            y: 0
        },
        trim: false,
        whiteSpace: 'pre',
        wordWrap: false,
        wordWrapWidth: 100,
        wordWrapHeight: undefined,
    };

    /**
     * Gets the computed font size options.
     *
     * @param      {number}  defaultFontSize                                    The default font size
     * @param      {string}  [resizingStrategy=textResizingStrategies.default]  The resizing strategy
     * @param      {object}  [resizingStrategyOptions={}]                       The resizing strategy options
     * @returns     {Array}   An array of the possible font size options, which are stepped through when checking resized text
     *                        ex: [110, 105, 100, 95, 90, ...]
     */
    function getComputedFontSizeOptions(
        defaultFontSize,
        resizingStrategy = textResizingStrategies.default,
        resizingStrategyOptions = {},
    ) {
        // The default option is just the default font size
        const percentOptions = [1];

        if (resizingStrategy === textResizingStrategies.stepAndBreakWords) {
            // stepAndBreakWords' options are 'stepDirection', and array that can be in the format enum['up', 'down']
            const stepDirection =
                resizingStrategyOptions.stepDirection || defaultStepAndBreakWordsOptions.stepDirection;

            // If the steps can go up, go up 10% and 5%
            if (stepDirection.includes(stepAndBreakWordsDirections.up)) {
                percentOptions.push(1.1, 1.05);
            }
            // If the steps can go down, go down to 50%
            if (stepDirection.includes(stepAndBreakWordsDirections.down)) {
                percentOptions.push(0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5);
            }
        }
        const pointOptions = percentOptions.map((option) => Math.round(defaultFontSize * option));

        // Sort the options in descending order
        return _.orderBy(pointOptions, _.identity, 'desc');
    }

    /**
     * The word wrap height controls the maximum height of a text box.
     * This comparable to the existing wordWrapWidth property of a TextStyle
     */
    Object.defineProperty(pixiNamespace.TextStyle.prototype, 'wordWrapHeight', {
        get: function get() {
            return this._wordWrapHeight;
        },
        set: function set(wordWrapHeight) {
            if (this._wordWrapHeight !== wordWrapHeight) {
                this._wordWrapHeight = wordWrapHeight;
                // Increment the style id so we know something changed
                this.styleID += 1;
            }
        },
    });

    /**
     * The text box position controls where the text is drawn from inside of when a text
     * object has a set word wrap width and height
     *
     * @param {Pixijs.Point} textBoxPosition
     */
    Object.defineProperty(pixiNamespace.TextStyle.prototype, 'textBoxPosition', {
        get: function get() {
            return this._textBoxPosition;
        },
        set: function set(textBoxPosition) {
            if (this._textBoxPosition !== textBoxPosition) {
                this._textBoxPosition = textBoxPosition;
                // Increment the style id so we know something changed
                this.styleID += 1;
            }
        },
    });

    /**
     * The text box position controls where the text is drawn from inside of when a text
     * object has a set word wrap width and height
     */
    Object.defineProperty(pixiNamespace.TextStyle.prototype, 'isTextBox', {
        get: function get() {
            // We need both the position and wrap height & width for a text object to function as a text box
            return (!_.isUndefined(this.textBoxPosition) &&
                !_.isUndefined(this.wordWrapWidth) &&
                !_.isUndefined(this.wordWrapHeight)
            );
        },
        // This property is not settable
        set: function set() {
            console.warn('isTextBox cannot be set');
        },
    });

    /**
     * The vertical align controls where the text is positioned in a Text Box.
     * Only affects Text Styles where isTextBox is true
     */
    Object.defineProperty(pixiNamespace.TextStyle.prototype, 'alignVertical', {
        get: function get() {
            return this._alignVertical;
        },
        set: function set(alignVertical) {
            if (this._alignVertical !== alignVertical) {
                this._alignVertical = alignVertical;
                // Increment the style id so we know something changed
                this.styleID += 1;
            }
        },
    });

    /**
     * A value to change how we want to resize the text style given the changing content.
     * Strategy options:
     *  default - No resizing or adjustment to the text.
     *  stepAndBreakWords - Step through our array of fontSizeOptions to get the largest possible font size.
     *                      Words that are too long are broken onto a new line. Currently only works with text boxes
     */
    Object.defineProperty(pixiNamespace.TextStyle.prototype, 'resizingStrategy', {
        get: function get() {
            return this._resizingStrategy;
        },
        set: function set(value) {
            // Only set the value if its one of our strategy options
            if (
                this._resizingStrategy !== value &&
                Object.keys(textResizingStrategies).indexOf(value) !== -1
            ) {
                this._resizingStrategy = value;
                // Increment the style id so we know something changed
                this.styleID += 1;
            }
        },
    });

    /**
     * Optional settings to alter our resizing strategy
     */
    Object.defineProperty(pixiNamespace.TextStyle.prototype, 'resizingStrategyOptions', {
        get: function get() {
            return this._resizingStrategyOptions;
        },
        set: function set(value) {
            if (!_.isEqual(this._resizingStrategyOptions, value)) {
                this._resizingStrategyOptions = value;
                // Increment the style id so we know something changed
                this.styleID += 1;
            }
        },
    });

    /**
     * An ordered array of possible font sizes for a text style to use based on the resizing strategy
     */
    Object.defineProperty(pixiNamespace.TextStyle.prototype, 'fontSizeOptions', {
        get: function get() {
            if (this._fontSizeOptions) {
                return this._fontSizeOptions;
            }
            return getComputedFontSizeOptions(
                this._fontSize,
                this._resizingStrategy,
                this._resizingStrategyOptions,
            );
        },
        set: function set(value) {
            // Order the array when it gets set
            this._fontSizeOptions = _.orderBy(value, _.identity, 'desc');
            this.styleID += 1;
        },
    });

    /**
     * Creates a new instance of the object with same properties than original.
     * Overwrites PixiJS' original method so we can also clone our custom properties
     *
     * @returns     {pixiNamespace}  Copy of this object.
     */
    // @dangerousMonkeyPatch
    pixiNamespace.TextStyle.prototype.clone = function() {
        const clonedProperties = {};
        // WM: Begin monkeypatch
        // Uses `TextStyle.DEFAULT_STYLE` instead of the protected
        // variable used in Pixi
        deepCopyProperties(clonedProperties, this, Object.keys(pixiNamespace.TextStyle.DEFAULT_STYLE));
        // WM: End monkeypatch
        return new pixiNamespace.TextStyle(clonedProperties);
    };

    /**
     * Resets all properties to the defaults specified in TextStyle.prototype.DEFAULT_STYLE
     */
    // @dangerousMonkeyPatch
    pixiNamespace.TextStyle.prototype.reset = function reset() {
        // WM: Begin monkeypatch
        // Uses `TextStyle.DEFAULT_STYLE` instead of the protected
        // variable used in Pixi
        deepCopyProperties(
            this,
            pixiNamespace.TextStyle.DEFAULT_STYLE,
            Object.keys(pixiNamespace.TextStyle.DEFAULT_STYLE),
        );
        // WM: End monkeypatch
    };
}