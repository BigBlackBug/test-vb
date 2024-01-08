/* eslint-disable import/prefer-default-export */
// Vendor
import _ from 'lodash';
import {
    Transform
} from 'pixi.js';

// Local
import {
    transformColorArray
} from '../utils/index.js';
import {
    Ease,
    LinearEase
} from '../timeline/index.js';

/**
 * Pre-transform a set of exported color property keyframes so it matches our expected tween structure for applyTween
 *
 * @param      {object}  objectProperty  The object properties
 */
export function transformColorKeyframes(objectProperty) {
    // Modifying the keyframe array because the value is actually a single color value
    const modifiedKeyframes = objectProperty.k.map((keyframe) =>
        _.extend({},
            keyframe,
            keyframe.s || keyframe.e ?
            {
                s: [transformColorArray(keyframe.s)],
                e: [transformColorArray(keyframe.e)]
            } :
            {},
        ),
    );
    return _.extend({}, objectProperty, {
        k: modifiedKeyframes
    });
}

/**
 * Gets the control points that describe a bezier ease points from a bodymovin keyframe.
 *
 * @param      {Object}  keyframe           The keyframe object from bodymovin
 * @param      {number}  [propertyIndex=0]  The property index (because bodymovin tweens can store multiple properties)
 * @return     {Array}   The bezier ease points from bodymovin.
 */
export function getBezierEasePointsFromBodymovin(keyframe, propertyIndex = 0) {
    let easeBezierPoints;
    if (
        Array.isArray(keyframe.o.x) &&
        Array.isArray(keyframe.o.y) &&
        Array.isArray(keyframe.i.x) &&
        Array.isArray(keyframe.i.y)
    ) {
        // If it's exporting an array of the same value for ease curves, take the first value
        easeBezierPoints = [
            keyframe.o.x.length - 1 < propertyIndex ? keyframe.o.x[0] : keyframe.o.x[propertyIndex],
            keyframe.o.y.length - 1 < propertyIndex ? keyframe.o.y[0] : keyframe.o.y[propertyIndex],
            keyframe.i.x.length - 1 < propertyIndex ? keyframe.i.x[0] : keyframe.i.x[propertyIndex],
            keyframe.i.y.length - 1 < propertyIndex ? keyframe.i.y[0] : keyframe.i.y[propertyIndex],
        ];
    } else {
        easeBezierPoints = [keyframe.o.x, keyframe.o.y, keyframe.i.x, keyframe.i.y];
    }

    return easeBezierPoints;
}

/**
 * Apply create and apply tweens from bodymovin to a Waymark timeline.
 *
 * @param      {string[]}    propertyNames                     The property names
 * @param      {object}    keyframes                           The keyframes object from bodymovin
 * @param      {Timeline}    timeline                          The timeline to add the tweens to
 * @param      {Function}  [transformFunction=(value)=>value]  A transform function, if the data needs to be converted for PIXI
 */
export function applyTween(
    propertyNames,
    keyframes,
    timeline,
    transformFunction = (value) => value,
) {
    keyframes.k.forEach((keyframe, index) => {
        // Make a tween for each separate property passed in, because it could have its own easing
        propertyNames.forEach((propertyName, propertyNameIndex) => {
            // If no properties change, do nothing
            if ((!keyframe.s || !keyframe.e) && !keyframe.h) {
                return;
            }

            const nextKeyframe = keyframes.k[index + 1];
            const startTime = keyframe.t;
            // Last keyframes are just set keyframes
            const duration = nextKeyframe ? nextKeyframe.t - keyframe.t : 0;
            let ease;
            if (keyframe.i && keyframe.o) {
                ease = new Ease(...getBezierEasePointsFromBodymovin(keyframe, propertyNameIndex));
            } else {
                ease = LinearEase;
            }

            const valueStart = transformFunction(keyframe.s[propertyNameIndex]);
            let valueEnd;

            /* If this keyframe uses hold interpolation, let's ensure we
            the object properties update at the appropriate moment. */
            if (keyframe.h === 1) {
                valueEnd = valueStart;
            } else {
                valueEnd = transformFunction(keyframe.e[propertyNameIndex]);
            }

            timeline.addTween(propertyName, {
                valueStart,
                valueEnd,
                startTime,
                duration,
                ease,
            });
        });
    });
}

/**
 * Gets the object transform matrix at time a particular global/root time
 *
 * @param      {PIXI.DisplayObject}  displayObject                The display object
 * @param      {number}  time                         The time
 * @return     {PIXI.Transform}  The object transform at time.
 */
export const getObjectTransformAtTime = (displayObject, time) => {
    const {
        layerTimeline
    } = displayObject;
    const transform = new Transform();
    transform.position.set(
        layerTimeline.getPropertyValueAtGlobalTime('position.x', time),
        layerTimeline.getPropertyValueAtGlobalTime('position.y', time),
    );
    transform.pivot.set(
        layerTimeline.getPropertyValueAtGlobalTime('pivot.x', time),
        layerTimeline.getPropertyValueAtGlobalTime('pivot.y', time),
    );
    transform.scale.set(
        layerTimeline.getPropertyValueAtGlobalTime('scale.x', time),
        layerTimeline.getPropertyValueAtGlobalTime('scale.y', time),
    );
    transform.rotation = layerTimeline.getPropertyValueAtGlobalTime('rotation', time);
    transform.skew.set(
        layerTimeline.getPropertyValueAtGlobalTime('skew.x', time),
        layerTimeline.getPropertyValueAtGlobalTime('skew.y', time),
    );
    transform.updateLocalTransform();
    return transform;
};