import {
    Timeline
} from '../../timeline/index.js';
import {
    applyTween,
    getInitialProperties
} from '../../manifest/index.js';
import {
    applyProperty
} from '../utils/index.js';

/**
 * Takes a effect property value in the form of:
 *  {
 *   "a": 0,
 *   "ix": 1,
 *   "k": 2
 *  }
 *
 * And creates tweens or applies properties based on how it is interpreted
 *
 * @param      {number}                 effectIndex            The effect index on the object
 * @param      {object}                 effectPropertyValue    The effect property value
 * @param      {number}                 effectPropertyValue.a  The "animation" key", 0 is not animated, 1 is animated
 * @param      {number|array}           effectPropertyValue.k  The "value" key, which will be the actual value of the property or an array of tween steps
 * @param      {object}                 destinationObject      The object whose value should be modified
 * @param      {string}                 objectPropertyName     The property on `destinationObject` that should be changed with the changing effect
 * @param      {function}               transformFunction      The transform function to take a bodymovin value to a pixijs value
 * @param      {Timeline}               timeline               The timeline (for animations)
 * @param      {number}                 duration               The duration of the timeline
 * @param      {function}               onUpdate               If there is additional work that needs to be done (other than setting a value), this callback will handle it
 */
export function applySelectionEffect(
    effectPropertyIndex,
    effectPropertyValue,
    destinationObject,
    objectPropertyName,
    transformFunction,
    timeline,
    duration,
    onUpdate,
) {
    // Animated
    const initialProperty = getInitialProperties(effectPropertyValue);
    applyProperty(destinationObject, objectPropertyName, initialProperty, transformFunction);
    if (effectPropertyValue.a) {
        applyTween(
            [`effects[${effectPropertyIndex}].${objectPropertyName}`],
            effectPropertyValue,
            timeline,
            transformFunction,
        );
        if (onUpdate) {
            timeline.registerHookCallback(Timeline.hookNames.rendering, onUpdate);
        }
    }
}

/**
 * Takes an effect property in the form of:
 *  {
 *    "ix": 1,
 *    "mn": "ADBE Set Matte3-0001",
 *    "nm": "Take Matte From Layer",
 *    "ty": 10,
 *    "v": {
 *      "a": 0,
 *      "ix": 1,
 *      "k": 2
 *    }
 *  }
 *
 *  And applies the value based on its type ("ty").
 *  Each of these types are connected to certain After Effects UIs (such as dropdowns, sliders, etc.)
 *
 * @param      {number}                 effectIndex            The effect index on the object
 * @param      {object}                 effectProperty      The effect property
 * @param      {string}                 effectProperty.ty   The effect property type
 * @param      {object}                 effectProperty.v    The effect property value
 * @param      {function}               effectOperation     The effect operation that is called with the effect property value
 * @param      {object}                 destinationObject   The object whose value should be modified
 * @param      {string}                 objectPropertyName  The property that should be changed with the changing effect
 * @param      {function}               transformFunction   The transform function to take a bodymovin value to a pixijs value
 * @param      {Timeline}               timeline            The timeline (for animations)
 * @param      {function}               onUpdate            If there is additional work that needs to be done (other than setting a value), this callback will handle it
 */
export function applyValueFromEffectProperty(
    effectIndex,
    effectProperty,
    destinationObject,
    objectPropertyName,
    transformFunction,
    timeline,
    onUpdate,
) {
    const effectPropertyValue = effectProperty.v;

    switch (effectProperty.ty) {
        // sliderControl
        case 0:
            {
                applySelectionEffect(
                    effectIndex,
                    effectPropertyValue,
                    destinationObject,
                    objectPropertyName,
                    transformFunction,
                    timeline,
                    onUpdate,
                );
                break;
            }
            // angleControl
        case 1:
            {
                break;
            }
            // colorControl
        case 2:
            {
                break;
            }
            // pointControl
        case 3:
            {
                break;
            }
            // checkboxControl
        case 4:
            {
                break;
            }
            // group
        case 5:
            {
                break;
            }
            // noValue
        case 6:
            {
                break;
            }
            // dropDownControl
        case 7:
            {
                applySelectionEffect(
                    effectIndex,
                    effectPropertyValue,
                    destinationObject,
                    objectPropertyName,
                    transformFunction,
                    timeline,
                    onUpdate,
                );
                break;
            }
            // customValue
        case 9:
            {
                break;
            }
            // layerIndex
        case 10:
            {
                applySelectionEffect(
                    effectIndex,
                    effectPropertyValue,
                    destinationObject,
                    objectPropertyName,
                    transformFunction,
                    timeline,
                    onUpdate,
                );
                break;
            }
            // maskIndex
        case 11:
            {
                break;
            }
        default:
            {
                applySelectionEffect(
                    effectIndex,
                    effectPropertyValue,
                    destinationObject,
                    objectPropertyName,
                    transformFunction,
                    timeline,
                    onUpdate,
                );
                break;
            }
    }
}