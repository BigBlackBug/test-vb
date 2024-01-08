import _ from 'lodash';
import {
    DisplayObject
} from 'pixi.js';
import BezierEasing from 'bezier-easing';

/**
 * This represents an animator that alters a text object's display
 *
 * @class      TextAnimator (name)
 */
class TextAnimator extends DisplayObject {
    constructor() {
        super();

        /**
         * Specifies how each selector combines with the text and with selector above it, similar to how multiple masks combine when you apply a mask mode.
         * For example, if you want to wiggle only a specific word, use a range selector on that word and then add a Wiggly selector and set it to Intersect mode.
         *
         * @member {Modes}
         */
        this.mode = TextAnimator.Modes.add;

        /**
         * The selector to determine how much of the text to animate at a time "Based on" in AfterEffects terminology
         *
         * @member {RangeTypes}
         */
        this.rangeType = TextAnimator.RangeTypes.characters;

        /**
         * The units for determining how much of the text object to select
         *
         * @member {RangeUnits}
         */
        this.rangeUnit = TextAnimator.RangeUnits.percentage;

        /**
         * The "shape" of the application of a range. A "square" shape is applied equally across a range,
         * where "round" would apply it subtly on the edges moving to a full application in the center
         *
         * @member {RangeShapes}
         */
        this.rangeShape = TextAnimator.RangeShapes.square;

        /**
         * The start of the segment of text to be animated.
         * Either an percentage (0-1) of the total characters or an index
         *
         * @member {number}
         */
        this.rangeStart = 0;

        /**
         * The end of the segment of text to be animated.
         * Either an percentage (0-1) of the total characters or an index
         *
         * @member {number}
         */
        this.rangeEnd = 1;

        /**
         * An offset to add to the start and end values. When an offset causes the start or end
         * to be < 0 or > 1, the value will wrap around.
         *
         * @member {number}
         */
        this.rangeOffset = 0;

        /**
         * Determines the speed of change as selection values change from fully included (high) to fully excluded (low).
         * For example, when Ease High is 100%, the character changes more gradually (eases into the change) while it is fully to partially selected.
         * When Ease High is -100%, the character changes quickly while it is fully to partially selected.
         * Range of -1 -> 1
         *
         * @member {number}
         */
        this.rangeEaseHigh = 0;

        /**
         * Determines the speed of change as selection values change from fully included (high) to fully excluded (low).
         * For example, when Ease Low is 100%, the character changes more gradually (eases into the change) while it is partially selected to unselected.
         * When Ease Low is -100%, the character changes quickly while it is partially selected to unselected
         * Range of -1 -> 1
         *
         * @member {number}
         */
        this.rangeEaseLow = 0;

        /**
         * A limit to the how much the animator is applied
         * Range of -1 -> 1
         *
         * @member {number}
         */
        this.rangeMaxAmount = 1;

        /**
         * A boolean to determine if the text objects should be affected randomly throughout the srting
         * TODO: should we use this?
         *
         * @member {boolean}
         */
        this.rangeRandomizeOrder = false;

        // We use and assign transform and alpha using the DisplayObject extension
        // Possible to add fill/stroke/tracking/etc. by subclassing Graphics or TextStyle?

        // TODO: Smoothness & Mode are not currently exported from after effects
    }

    apply(
        charSprite, {
            totalCharacters,
            currentCharacterIndex,
            totalCharactersExcludingSpaces,
            currentCharacterIndexExcludingSpaces,
            totalWords,
            currentWordIndex,
            totalLines,
            currentLineIndex,
        },
        // This is a transform that is collecting all the "transform" changes
        // done by the text animator
        animatorTransform
    ) {
        if (!charSprite.worldVisible) {
            return;
        }

        this.transform.updateLocalTransform();

        let currentPositionStart = 0;
        let currentPositionEnd = 0;
        const isPercentage = this.rangeUnit === TextAnimator.RangeUnits.percentage;

        switch (this.rangeType) {
            case TextAnimator.RangeTypes.characters:
                currentPositionStart = currentCharacterIndex / (isPercentage ? totalCharacters : 1);
                currentPositionEnd = (currentCharacterIndex + 1) / (isPercentage ? totalCharacters : 1);
                break;
            case TextAnimator.RangeTypes.charactersExcludingSpaces:
                currentPositionStart =
                    currentCharacterIndexExcludingSpaces /
                    (isPercentage ? totalCharactersExcludingSpaces : 1);
                currentPositionEnd =
                    (currentCharacterIndexExcludingSpaces + 1) /
                    (isPercentage ? totalCharactersExcludingSpaces : 1);
                break;
            case TextAnimator.RangeTypes.word:
                currentPositionStart = currentWordIndex / (isPercentage ? totalWords : 1);
                currentPositionEnd = (currentWordIndex + 1) / (isPercentage ? totalWords : 1);
                break;
            case TextAnimator.RangeTypes.line:
                currentPositionStart = currentLineIndex / (isPercentage ? totalLines : 1);
                currentPositionEnd = (currentLineIndex + 1) / (isPercentage ? totalLines : 1);
                break;
            default:
                break;
        }
        const currentRangeWidth = currentPositionEnd - currentPositionStart;
        const currentRangeCenter = currentPositionStart + currentRangeWidth / 2;

        let magnitude = 0;

        // TODO: get offset looping right. See Trim paths in graphics for example
        const animatorRangeStart = this.rangeStart + this.rangeOffset;
        const animatorRangeEnd = this.rangeEnd + this.rangeOffset;
        const animatorRangeEarliest = Math.min(animatorRangeStart, animatorRangeEnd);
        const animatorRangeLatest = Math.max(animatorRangeStart, animatorRangeEnd);
        const animatorRangeWidth = (animatorRangeLatest - animatorRangeEarliest);
        const animatorRangeCenter = animatorRangeEarliest + (animatorRangeWidth) / 2;

        const proportionInRange = _.clamp((Math.min(currentPositionEnd, animatorRangeLatest) - Math.max(currentPositionStart, animatorRangeEarliest)) / currentRangeWidth, 0, 1);

        const easeBezierPoints = [
            this.rangeEaseLow > 0 ? this.rangeEaseLow : 0,
            this.rangeEaseLow < 0 ? -this.rangeEaseLow : 0,
            this.rangeEaseHigh > 0 ? 1 - this.rangeEaseHigh : 1,
            this.rangeEaseHigh < 0 ? 1 + this.rangeEaseHigh : 1,
        ];

        // A linear/right triangle bezier used for the ramp up/down shapes
        const rampBezier = new BezierEasing(...easeBezierPoints);

        if (this.rangeShape === TextAnimator.RangeShapes.square) {
            // If you are in range, your magnitude reflects that proportion
            // TODO: Ease Low/Ease High will slightly affect this
            magnitude = 1 * proportionInRange;
        } else if (this.rangeShape === TextAnimator.RangeShapes.rampUp) {
            // A right triangle moving upwards starting at 0 -> 1
            //             mult = 1 - max(0, min(0.5 / (e - s) + (ind - s) / (e - s), 1));

            magnitude = rampBezier(animatorRangeWidth === 0 ? 1 : _.clamp((currentRangeCenter - animatorRangeEarliest) / animatorRangeWidth, 0, 1));
        } else if (this.rangeShape === TextAnimator.RangeShapes.rampDown) {
            // A right triangle moving downwards starting at 1 -> 0
            magnitude = rampBezier(animatorRangeWidth === 0 ? 1 : 1 - _.clamp((currentRangeCenter - animatorRangeEarliest) / animatorRangeWidth, 0, 1));
        } else if (this.rangeShape === TextAnimator.RangeShapes.triangle) {
            // A triangle with its peak in the middle 0 -> 1 -> 0
            const triangleBezierPoints = [
                0,
                0,
                1,
                1,
            ];
            const triangleBezier = new BezierEasing(...triangleBezierPoints);
            // First Half of Triangle
            if (currentRangeCenter <= animatorRangeCenter) {
                magnitude =
                    rampBezier(triangleBezier(animatorRangeWidth === 0 ? 1 : _.clamp((currentRangeCenter - animatorRangeStart) / (animatorRangeWidth / 2), 0, 1)));
                // Second Half of Triangle
            } else if (currentRangeCenter > animatorRangeCenter) {
                magnitude =
                    rampBezier(triangleBezier(animatorRangeWidth === 0 ? 0 : _.clamp((animatorRangeEnd - currentRangeCenter) / (animatorRangeWidth / 2), 0, 1)));
            }
        } else if (this.rangeShape === TextAnimator.RangeShapes.round) {
            // A half circle
            const roundBezierPoints = [
                0,
                0,
                0.5,
                1,
            ];
            const roundBezier = new BezierEasing(...roundBezierPoints);
            // First half of circle
            if (currentRangeCenter <= animatorRangeCenter) {
                magnitude = rampBezier(roundBezier(animatorRangeWidth === 0 ? 0 : _.clamp((currentRangeCenter - animatorRangeEarliest) / (animatorRangeWidth / 2), 0, 1)));
                // Second half of circle
            } else {
                magnitude = rampBezier(roundBezier(animatorRangeWidth === 0 ? 1 : _.clamp((animatorRangeLatest - currentRangeCenter) / (animatorRangeWidth / 2), 0, 1)));
            }
        } else if (this.rangeShape === TextAnimator.RangeShapes.smooth) {
            // Half of a parabola, much like a standard deviation curve
            // Used for approximating an in-out bezier curve
            const easeInOutBezierPoints = [
                0.5,
                0,
                0.5,
                1,
            ];
            const easeInOutBezier = new BezierEasing(...easeInOutBezierPoints);

            // First half of parabola
            if (currentRangeCenter <= animatorRangeCenter) {
                magnitude = rampBezier(easeInOutBezier(
                    animatorRangeWidth ? _.clamp((currentRangeCenter - animatorRangeEarliest) / (animatorRangeWidth / 2), 0, 1) : 1,
                ));
            } else {
                // Second half of parabola
                magnitude = rampBezier(easeInOutBezier(
                    animatorRangeWidth ? _.clamp((animatorRangeLatest - currentRangeCenter) / (animatorRangeWidth / 2), 0, 1) : 1,
                ));
            }
        }

        magnitude *= this.rangeMaxAmount;

        // ANIMATOR MODES
        // TODO: Animators may have to know about other animators attached to an object and/or run at the same time.
        switch (this.mode) {
            case TextAnimator.Modes.subtract:
                magnitude = 1 - magnitude;
                break;
            case TextAnimator.Modes.intersect:
            case TextAnimator.Modes.min:
            case TextAnimator.Modes.max:
            case TextAnimator.Modes.difference:
            default:
                // Add is standard, so nothing happens
                break;
        }

        if (this.textAnimatorData.a.p) {
            animatorTransform.position.x += (this.position.x * magnitude) / charSprite.scale.x;
            animatorTransform.position.y += (this.position.y * magnitude) / charSprite.scale.y;
        }

        if (this.textAnimatorData.a.s) {
            animatorTransform.scale.x *= 1 + (magnitude * (this.scale.x - 1));
            animatorTransform.scale.y *= 1 + (magnitude * (this.scale.y - 1));
        }

        if (this.textAnimatorData.a.r) {
            animatorTransform.rotation += this.rotation * magnitude;
        }

        if (this.textAnimatorData.a.sk) {
            animatorTransform.skew.x += this.skew.x * magnitude;
        }

        if (this.textAnimatorData.a.sa) {
            animatorTransform.skew.y += this.skew.y * magnitude;
        }

        if (this.textAnimatorData.a.o) {
            // eslint-disable-next-line no-param-reassign
            // Don't do anything if the magnitude is 0 (this is implied in the transform code because
            // it is using += and *= that will not change the value if the magnitude is 0).
            if (magnitude > 0) {
                charSprite.alpha = _.clamp(charSprite.alpha - (1 - this.alpha) * magnitude, 0, 1);
            }
        }
    }
}

/**
 * @typedef {object} Modes
 * Detrmines how each selector combines with the text and with selector above it
 * @property {string} [add='add'] The magnitudes combine, adding together
 * @property {string} [subtract='subtract'] The magnitudes subtract from each other
 * @property {string} [intersect='intersect'] ???
 * @property {string} [min='min'] The smaller magnitudes is used
 * @property {string} [max='max'] The larger magnitude is used
 * @property {string} [difference='difference'] The difference between the magnitudes is used
 * @global
 */
TextAnimator.Modes = {
    add: 'add',
    subtract: 'subtract',
    intersect: 'intersect',
    min: 'min',
    max: 'max',
    difference: 'difference',
};

/**
 * @typedef {object} RangeTypes
 * The selector to determine how much of the text to animate at a time
 * @property {string} [characters='characters']  An individual character
 * @property {string} [charactersExcludingSpaces='charactersExcludingSpaces']  An individual character (ignoring/skipping spaces)
 * @property {string} [word='word']  A whole word
 * @property {string} [line='line']  A whole line
 * @global
 */
TextAnimator.RangeTypes = {
    characters: 'characters',
    charactersExcludingSpaces: 'charactersExcludingSpaces',
    word: 'word',
    line: 'line',
};

/**
 * @typedef {object} RangeUnits
 * The units for determining how much of the text object to select
 * @property {string} [percentage='percentage']  Percentage (0->1) of the text string
 * @property {string} [index='index']  The index (0, 1, 2...) of the text string (by selector type, so index 1 of 'lines', would be the second line)
 * @global
 */
TextAnimator.RangeUnits = {
    percentage: 'percentage',
    index: 'index',
};

/**
 * @typedef {object} RangeShapes
 * The "shape" of the application of a range. A "square" shape is applied equally across a range,
 * where "round" would apply it subtly on the edges moving to a full application in the center
 * @property {string} [square='Square']  Applied equally across the entire range
 * @property {string} [rampUp='Ramp Up']  Applied as a right triangle moving up and to the right
 * @property {string} [rampDown='Ramp Down']  Applied as a right triangle moving down and to the right
 * @property {string} [triangle='Triangle']  Applied as a triangle peaking in the center
 * @property {string} [round='Round']  Applied as an ellipsoid peaking in the center, but off the bottom at the edges
 * @property {string} [smooth='Smooth']  Applied as an half-ellipsoid peaking in the center, with edges touching the bottom
 * @global
 */
TextAnimator.RangeShapes = {
    square: 'Square',
    rampUp: 'Ramp Up',
    rampDown: 'Ramp Down',
    triangle: 'Triangle',
    round: 'Round',
    smooth: 'Smooth',
};

export default TextAnimator;