/* eslint-disable func-names, no-param-reassign, no-underscore-dangle */
import {
    applyTween,
    getInitialProperties
} from '../../manifest/index.js';
import {
    applyProperty
} from '../utils/index.js';

/**
 * Helper method for apply trim path properties and tweens
 *
 * @param      {pixijs.Graphics}  graphicsObject  The graphics object to work on
 * @param      {object}    data                   The data from bodymovin
 * @param      {string}    name                   The name of the trim path property
 * @param      {string}    key                    The key of the property on the bodymovin data
 * @param      {Timeline}  timeline               The timeline
 * @param      {number}    transformValue         The transform value that path properties are multiplied by
 */
function applyTrimPathProperty(graphicsObject, data, name, key, timeline, transformValue) {
    if (data[key]) {
        const initialProperty = getInitialProperties(data[key]);
        applyProperty(
            graphicsObject.trimPath,
            name,
            initialProperty,
            (value) => value * transformValue,
        );

        if (data[key].a) {
            graphicsObject.trimPath[name] = data[key].k[0].s * transformValue;
            applyTween([`trimPath.${name}`], data[key], timeline, (value) => value * transformValue);
        }
    }
}

/**
 * Applies properties about this graphic object's trimPath based on a bodymovin export
 *
 * @param      {pixijs.Graphics}    graphicsObject  The graphics object to act on
 * @param      {object}             trimPathData  The trimPath data from bodymovin
 * @param      {Timeline}  timeline  The timeline
 */
export default function applyTrimPathPropertiesFromBodymovin(
    graphicsObject,
    trimPathData,
    timeline,
) {
    // trimPath start
    // Bodymovin trim paths represents 100% as 100, We represent that as 1
    applyTrimPathProperty(graphicsObject, trimPathData, 'start', 's', timeline, 0.01);

    // trimPath end
    // Bodymovin trim paths represents 100% as 100, We represent that as 1
    applyTrimPathProperty(graphicsObject, trimPathData, 'end', 'e', timeline, 0.01);

    // trimPath offset
    // Bodymovin trim paths offsets are on a scale of 360 degrees = 1 full offset
    applyTrimPathProperty(graphicsObject, trimPathData, 'offset', 'o', timeline, 1 / 360);

    return {
        isAnimated: Boolean(trimPathData.s.a || trimPathData.e.a || trimPathData.o.a),
    };
}