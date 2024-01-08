import {
    WMBitmapText
} from 'pixi.js';
import {
    applyTransformsToObject,
    applyProperty
} from '../utils/index.js';
import {
    getInitialProperties
} from '../../manifest/index.js';
import {
    applyTween
} from '../tweens.js';
import {
    TextAnimator
} from '../../lib/pixi-text-animator/index.js';
import {
    Timeline
} from '../../timeline/index.js';

// eslint-disable-next-line no-unused-vars
const BM_PROPERTIES = {
    // Applied in applyTransformsToObject
    'Anchor Point 3D': 'a',
    'Position 3D': 'p',
    'Scale 3D': 's',
    Rotation: 'r',
    'Rotation X': 'rx',
    'Rotation Y': 'ry',
    Opacity: 'o',
    Skew: 'sk',
    'Skew Axis': 'sa',

    // Not currently supported
    'Fill Color': 'fc',
    'Fill Hue': 'fh',
    'Fill Saturation': 'fs',
    'Fill Brightness': 'fb',
    'Stroke Color': 'sc',
    'Stroke Hue': 'sh',
    'Stroke Saturation': 'ss',
    'Stroke Brightness': 'sb',
    'Stroke Width': 'sw',
    'Fill Opacity': 'fo',
    'Stroke Opacity': 'so',
    'Tracking Amount': 't',
};

// TODO: Smoothness & Mode are not currently exported from after effects
const BM_RANGE_PROPERTIES = {
    rangeEaseHigh: 'xe',
    mode: 'mo',
    rangeEaseLow: 'ne',
    rangeMaxAmount: 'a',
    rangeType: 'b',
    rangeRandomizeOrder: 'rn',
    rangeShape: 'sh',
    rangeUnits: 'r',
    start: 's',
    end: 'e',
    offset: 'o',
};

const BM_RANGE_TYPE_TO_ANIMATOR = {
    1: TextAnimator.RangeTypes.characters,
    2: TextAnimator.RangeTypes.charactersExcludingSpaces,
    3: TextAnimator.RangeTypes.word,
    4: TextAnimator.RangeTypes.line,
};

const BM_MODE_TO_ANIMATOR = {
    1: TextAnimator.Modes.add,
    2: TextAnimator.Modes.subtract,
    3: TextAnimator.Modes.intersect,
    4: TextAnimator.Modes.min,
    5: TextAnimator.Modes.max,
    6: TextAnimator.Modes.difference,
};

const BM_RANGE_UNIT_TO_ANIMATOR = {
    1: TextAnimator.RangeUnits.percentage,
    2: TextAnimator.RangeUnits.index,
};

const BM_RANGE_SHAPE_TO_ANIMATOR = {
    1: TextAnimator.RangeShapes.square,
    2: TextAnimator.RangeShapes.rampUp,
    3: TextAnimator.RangeShapes.rampDown,
    4: TextAnimator.RangeShapes.triangle,
    5: TextAnimator.RangeShapes.round,
    6: TextAnimator.RangeShapes.smooth,
};

/**
 * A generic function to DRY up code whn applying text animators
 *
 * @param      {string}             propertyName       The property name
 * @param      {TextAnimator}       textAnimator       The text animator we are applying the properties to
 * @param      {object}             propertyData       The property data from bodymovin
 * @param      {Function}           transformFunction  The function that alters data from bodymovin to Pixi/Waymark
 */
export const applyTextAnimatorRangeProperty = (
    propertyName,
    textAnimator,
    propertyData,
    transformFunction = (val) => val,
) => {
    const initialProperty = getInitialProperties(propertyData);
    applyProperty(textAnimator, propertyName, initialProperty, transformFunction);

    // Animated?
    if (propertyData.a) {
        applyTween([propertyName], propertyData, textAnimator.timeline, transformFunction);
    }
};

/**
 * Creates a text animator using data from bodymovin
 *
 * @param      {WMBitmapText}   textObject        The text object the animator is applied to
 * @param      {object}            textAnimatorData  The text animator data from bodymovin
 * @param      {number}            index             The index of the animator in the list
 * @param      {Timeline}          textTimeline          The layer timeline (for the text object)
 * @returns    {TextAnimator} A fully constructed TextAnimator
 */
export function createTextAnimatorFromData(textObject, textAnimatorData, index, textTimeline) {
    let textAnimator;
    let timeline;

    if (textObject.animators[index]) {
        textAnimator = textObject.animators[index];
        ({
            timeline
        } = textAnimator);
        timeline.removeAllTweens();
        timeline.removeAllHooks();
    } else {
        textAnimator = new TextAnimator();
        timeline = new Timeline({
            target: textAnimator
        });
        // eslint-disable-next-line no-param-reassign
        textObject.animators[index] = textAnimator;
        textAnimator.timeline = timeline;
        textTimeline.addTimeline(textAnimator.timeline, 0);
    }

    textAnimator.name = textAnimatorData.nm;

    const {
        a: animatorProperties,
        s: selectorProperties
    } = textAnimatorData;
    textAnimator.textAnimatorData = textAnimatorData;

    // Apply the transform properties to the animator
    applyTransformsToObject(textAnimator, animatorProperties, timeline);

    const mode = selectorProperties[BM_RANGE_PROPERTIES.mode];
    const rangeStart = selectorProperties[BM_RANGE_PROPERTIES.start];
    const rangeEnd = selectorProperties[BM_RANGE_PROPERTIES.end];
    const rangeOffset = selectorProperties[BM_RANGE_PROPERTIES.offset];
    const rangeUnit = selectorProperties[BM_RANGE_PROPERTIES.rangeUnits];
    const rangeType = selectorProperties[BM_RANGE_PROPERTIES.rangeType];
    const rangeShape = selectorProperties[BM_RANGE_PROPERTIES.rangeShape];
    const rangeEaseHigh = selectorProperties[BM_RANGE_PROPERTIES.rangeEaseHigh];
    const rangeEaseLow = selectorProperties[BM_RANGE_PROPERTIES.rangeEaseLow];
    const rangeMaxAmount = selectorProperties[BM_RANGE_PROPERTIES.rangeMaxAmount];

    if (rangeType) {
        textAnimator.rangeType = BM_RANGE_TYPE_TO_ANIMATOR[rangeType];
    }

    if (rangeUnit) {
        textAnimator.rangeUnit = BM_RANGE_UNIT_TO_ANIMATOR[rangeUnit];
    }

    if (rangeShape) {
        textAnimator.rangeShape = BM_RANGE_SHAPE_TO_ANIMATOR[rangeShape];
    }

    textAnimator.rangeRandomizeOrder = Boolean(
        selectorProperties[BM_RANGE_PROPERTIES.rangeRandomizeOrder],
    );

    // If the range units are in percentage, we need to transform the value
    const percentageTransformFunction = (value) => value * 0.01;
    const isRangeUnitsIndex = textAnimator.rangeUnits === TextAnimator.RangeUnits.index;

    // These properties don't exist if they're the same as the default
    // Apply the mode
    if (mode) {
        applyTextAnimatorRangeProperty(
            'mode',
            textAnimator,
            BM_MODE_TO_ANIMATOR[mode],
            (modeId) => BM_MODE_TO_ANIMATOR[modeId],
        );
    }

    // Apply the start
    if (rangeStart) {
        // We only apply the transform function if the units are percentage
        applyTextAnimatorRangeProperty(
            'rangeStart',
            textAnimator,
            rangeStart,
            isRangeUnitsIndex ? undefined : percentageTransformFunction,
        );
    }

    // Apply the end
    if (rangeEnd) {
        // We only apply the transform function if the units are percentage
        applyTextAnimatorRangeProperty(
            'rangeEnd',
            textAnimator,
            rangeEnd,
            isRangeUnitsIndex ? undefined : percentageTransformFunction,
        );
    } else if (isRangeUnitsIndex) {
        // The default value if the range units are index is 10
        textAnimator.rangeEnd = 10;
    }

    // Apply the offset
    if (rangeOffset) {
        // We only apply the transform function if the units are percentage
        applyTextAnimatorRangeProperty(
            'rangeOffset',
            textAnimator,
            rangeOffset,
            isRangeUnitsIndex ? undefined : percentageTransformFunction,
        );
    }

    // Apply high end of the ease
    if (rangeEaseHigh) {
        applyTextAnimatorRangeProperty(
            'rangeEaseHigh',
            textAnimator,
            rangeEaseHigh,
            percentageTransformFunction,
        );
    }

    // Apply low end of the ease
    if (rangeEaseLow) {
        applyTextAnimatorRangeProperty(
            'rangeEaseLow',
            textAnimator,
            rangeEaseLow,
            percentageTransformFunction,
        );
    }

    // Apply the maximum amount the range can affect the text object
    if (rangeMaxAmount) {
        applyTextAnimatorRangeProperty(
            'rangeMaxAmount',
            textAnimator,
            rangeMaxAmount,
            percentageTransformFunction,
        );
    }

    return textAnimator;
}