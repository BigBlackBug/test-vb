/* eslint-disable no-param-reassign */
import _ from 'lodash';
import {
    Point,
    utils,
    TextStyle
} from 'pixi.js';
import {
    Timeline
} from '../../timeline/index.js';
import {
    applyTween
} from '../tweens.js';
import {
    getResizingStrategyFromMetadata
} from './utils.js';

export const TEXT_JUSTIFY_MODES = {
    left: 0,
    right: 1,
    center: 2,
    fullWidthLastLineLeft: 3,
    fullWidthLastLineRight: 4,
    fullWidthLastLineCenter: 5,
    fullWidthLastLineAll: 6,
};

/**
 * Apply text style properties from the Bodymovin export to a TextStyle object
 *
 * @param      {TextStyle}  textStyle                   The TextStyle object
 * @param      {object}             textStylePropertyKeyframes  An object of transform properties exported from bodymovin.
 *                                                              This should be in the data.json text "t" member keyframe format.
 * @param      {Timeline}           timeline                    The timeline (for animations)
 * @param      {object}             metadata                    The layer metadata
 */
export function applyTextStylePropertiesToText(
    textStyle,
    textStylePropertyKeyframes,
    timeline,
    metadata = {},
) {
    // Text style Keyframes are a little weird in that they are structured with the entire start value as
    // a single object and they are always considered animated (the "a" key does not exist)
    // They also do not posess the ability to be eased, and are effectively hold interpolation always
    //
    // Example:
    // [
    //   {
    //    "s": {
    //      ...styleProperties
    //    },
    //    "t": 0
    //   },
    // ]
    //
    // We are going to convert this to a format more like the rest of the tweens
    //
    // [
    //   {
    //    "s": [10],
    //    "h": 1,
    //    "t": 0,
    //   },
    // ]
    //
    const formattedKeyframes = {};

    textStylePropertyKeyframes.forEach((textStylePropertyKeyframe, index) => {
        const styleProperties = {};

        if ('s' in textStylePropertyKeyframe.s) {
            styleProperties.fontSize = textStylePropertyKeyframe.s.s;

            /**
             * tr or "Tracking" refers to the adjusted spacing between every letter in a word.
             * While PIXI.Text does respect kerning by drawing character by character (https://github.com/pixijs/pixi.js/pull/6091),
             * this is still dependent on CSS's interpretation of kerning (https://developer.mozilla.org/en-US/docs/Web/CSS/font-kerning).
             * Browser's can behave differently on whether or not they respect font kerning, so there could be platform-specific differences
             * when drawing text with PIXI.Text (but letter-spacing/tracking will be spaced identically). Reminder: kerning !== tracking.
             */
            if ('tr' in textStylePropertyKeyframe.s) {
                // AE's unit of 1000 is equal to 1em of letter spacing
                const tracking = textStylePropertyKeyframe.s.tr;

                // PIXI expects `letterSpacing` in pixels. We're assuming 1em is
                // equal to the font size in pixels (e.g. for a font size of 24px, the width
                // of 1em is 24px). https://en.wikipedia.org/wiki/Em_(typography)
                const letterSpacing = (tracking / 1000) * styleProperties.fontSize;

                // PIXI.js expects letterSpacing in pixels
                styleProperties.letterSpacing = letterSpacing;
            }
        }

        if ('j' in textStylePropertyKeyframe.s) {
            switch (textStylePropertyKeyframe.s.j) {
                case TEXT_JUSTIFY_MODES.left:
                    // properties.anchorX = 1;
                    // properties.anchorY = 0.5;
                    styleProperties.align = 'left';
                    break;

                case TEXT_JUSTIFY_MODES.right:
                    // properties.anchorX = 0;
                    // properties.anchorY = 0.5;
                    styleProperties.align = 'right';
                    break;

                case TEXT_JUSTIFY_MODES.center:
                    // properties.anchorX = 0.5;
                    // properties.anchorY = 0.5;
                    styleProperties.align = 'center';
                    break;

                    // The FULL_JUSTIFY cases are for aligning the last line
                    // of a multiline full-width text body. We'll need to
                    // implement this somehow.
                case TEXT_JUSTIFY_MODES.fullWidthLastLineLeft:
                    // Example output:
                    //   A B C D E F
                    //   1    2    3
                    //   a b c d e f
                    //   g  h   i  j
                    //   k l m n
                    styleProperties.align = 'center';
                    break;

                case TEXT_JUSTIFY_MODES.fullWidthLastLineRight:
                    // Example output:
                    //   A B C D E F
                    //   1    2    3
                    //   a b c d e f
                    //   g  h   i  j
                    //       k l m n
                    styleProperties.align = 'center';
                    break;

                case TEXT_JUSTIFY_MODES.fullWidthLastLineCenter:
                    // Example output:
                    //   A B C D E F
                    //   1    2    3
                    //   a b c d e f
                    //   g  h   i  j
                    //     k l m n
                    styleProperties.align = 'center';
                    break;

                case TEXT_JUSTIFY_MODES.fullWidthLastLineAll:
                    // Example output:
                    //   A B C D E F
                    //   1    2    3
                    //   a b c d e f
                    //   g  h   i  j
                    //   k  l   m  n
                    styleProperties.align = 'center';
                    break;

                default:
                    break;
            }
        }

        if ('lh' in textStylePropertyKeyframe.s) {
            styleProperties.lineHeight = textStylePropertyKeyframe.s.lh;
        }

        if ('fc' in textStylePropertyKeyframe.s) {
            styleProperties.fill = utils.rgb2hex(textStylePropertyKeyframe.s.fc);
            /* If there's no `fc` (fill color) property set, we should render the text
            with a transparent fill. */
        } else {
            styleProperties.fill = 'transparent';
        }

        if ('sc' in textStylePropertyKeyframe.s) {
            styleProperties.stroke = utils.rgb2hex(textStylePropertyKeyframe.s.sc);
        }

        if ('sw' in textStylePropertyKeyframe.s) {
            styleProperties.strokeThickness = textStylePropertyKeyframe.s.sw;
        }

        if ('f' in textStylePropertyKeyframe.s) {
            // TODO: Tween this
            const fontName = textStylePropertyKeyframe.s.f;
            styleProperties.fontFamily = fontName;
            // NOTE: These are currently stored on the font object instead of the style.
            //        Do we need these, and/or how do we store these on a Bitmap Font
            //        We might want to store them in both places
            // styleProperties.fontStyle = font.style;
            // styleProperties.fontWeight = font.weight;
        }

        // sz refers to the the size of a text box
        if ('sz' in textStylePropertyKeyframe.s) {
            styleProperties.wordWrap = true;
            [
                styleProperties.wordWrapWidth,
                styleProperties.wordWrapHeight,
            ] = textStylePropertyKeyframe.s.sz;
        }

        // ps refers to the the position of a text box (which adjusts the position in addition to the other element positioning)
        if ('ps' in textStylePropertyKeyframe.s) {
            styleProperties.textBoxPosition = new Point(...textStylePropertyKeyframe.s.ps);
        }

        // "of" refers to the After Effects "All Strokes Over All Fills" setting,
        // which causes the stroke to expand inward, giving the appearance of a
        // larger stroke without actually increasing the font size or element
        // dimensions. PixiJS has no built-in equivalent to this, so we'll need
        // to mimic it, possibly by manually increasing the stroke size and
        // decreasing the font size.
        // if ('of' in textStylePropertyKeyframe.s) {
        // }
        Object.keys(styleProperties).forEach((styleKey) => {
            const styleValue = styleProperties[styleKey];

            // Set the initial style properties
            if (index === 0) {
                textStyle[styleKey] = styleValue;
            }

            if (!formattedKeyframes[styleKey]) {
                formattedKeyframes[styleKey] = [];
            }

            formattedKeyframes[styleKey].push({
                s: [styleValue],
                h: 1,
                t: textStylePropertyKeyframes.t || 0,
            });
        });
    });

    // Add them to the timeline
    Object.keys(formattedKeyframes).forEach((styleKey) => {
        applyTween([`style.${styleKey}`], {
            k: formattedKeyframes[styleKey]
        }, timeline);
    });

    // Apply Custom Style properties (that aren't tweened and are always the same)
    // The vertical alignment of the text
    textStyle.alignVertical = _.get(metadata, 'textOptions.verticalAlignment', 'top');

    // Assign our resizing strategy
    const {
        resizingStrategy,
        resizingStrategyOptions
    } = getResizingStrategyFromMetadata(metadata);
    textStyle.resizingStrategy = resizingStrategy;
    textStyle.resizingStrategyOptions = resizingStrategyOptions;

    // If we have custom font size options
    const fontSizeOptions = _.get(metadata, 'textOptions.fontSizeOptions', []);
    if (fontSizeOptions.length) {
        textStyle.fontSizeOptions = fontSizeOptions;
    }
}

/* eslint-enable no-param-reassign */