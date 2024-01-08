import _ from 'lodash';
import {
    Ease,
    LinearEase,
    Timeline
} from '../timeline/index.js';

// Local
import {
    getAssetDataType
} from './assetData.js';
import {
    assetTypes,
    layerTypes
} from './constants.js';

/**
 * @namespace LayerDataParsing
 */

/**
 * Returns the exported layer type value, stored in `ty`.
 *
 * @param  {object} layerData Exported layer object from bodymovin
 * @returns {number} The number representing the layer type
 * @memberof LayerDataParsing
 * @public
 */
export function getLayerType(layerData) {
    return layerData.ty;
}

/**
 * Helper function to allow for the UUID or Id of a layer to be used as a predicate
 *
 * @param {Function|object|Array|string} predicate A predicate function, object, or a string representing the id or uuid of the layer
 * @returns {Function|object|Array} A usable expression
 */
const getPredicateExpression = (predicate) => {
    if (_.isString(predicate)) {
        // An expression of `#myIdName` searches for a layer id
        if (predicate[0] === '#') {
            return ['meta.id', predicate.slice(1)];
        }
        // Otherwise it's a layer uuid
        return ['meta.uuid', predicate];
    }

    return predicate;
};

/**
 * Find layer data for an expression.
 *
 * @example
 *  findLayerData(videoData, '#myIdName')
 *  findLayerData(videoData, '0123-myuuid-2345')
 *  findLayerData(videoData, (layer)=>layer.nm==='My Layer Name')
 * @param  {object|Array}  videoData   Video data
 * @param {Function|object|Array|string} predicate A predicate function, object, or a string representing the id or uuid of the layer
 * @returns {object|null} Layer data or null
 * @memberof LayerDataParsing
 * @public
 */
export function findLayerData(videoData, predicate) {
    const predicateExpression = getPredicateExpression(predicate);

    const isLayerArray = Array.isArray(videoData);

    const assets = videoData.assets || [];
    const layers = isLayerArray ? videoData : videoData.layers;

    // Search through the primary composition first
    let layerData = _.find(layers, predicateExpression);
    if (layerData) {
        return layerData;
    }

    // Otherwise go through the asset array to look through sub compositions
    for (let i = 0; i < assets.length; i += 1) {
        const asset = assets[i];

        if (getAssetDataType(asset) === assetTypes.composition && asset.layers) {
            layerData = _.find(asset.layers, predicateExpression);
            if (layerData) {
                return layerData;
            }
        }
    }

    return layerData || null;
}

/**
 * Filter layer data for an expression.
 *
 * @param  {object|Array}  videoData   Video data
 * @param {Function|object|Array|string} predicate A predicate function, object, or a string representing the id or uuid of the layer
 * @returns {object[]} Aray of Layer data
 * @memberof LayerDataParsing
 * @public
 */
export function filterLayerData(videoData, predicate) {
    const predicateExpression = getPredicateExpression(predicate);

    const isLayerArray = Array.isArray(videoData);

    const assets = videoData.assets || [];
    const layers = isLayerArray ? videoData : videoData.layers;

    // Search through the primary composition first
    const layerData = _.filter(layers, predicateExpression);

    // Otherwise go through the asset array to look through sub compositions
    for (let i = 0; i < assets.length; i += 1) {
        const asset = assets[i];

        if (getAssetDataType(asset) === assetTypes.composition && asset.layers) {
            layerData.push(..._.filter(asset.layers, predicateExpression));
        }
    }

    return layerData;
}

/**
 * Find layer data for a UUID.
 *
 * @param  {object | Array}  videoData   Video data
 * @param  {string}        uuid        UUID
 * @returns {object}                    Layer data or null
 * @memberof LayerDataParsing
 * @public
 */
export function findLayerDataByUUID(videoData, uuid) {
    console.warn('findLayerDataByUUID is deprecated, please use findLayerData');
    return findLayerData(videoData, uuid);
}

/**
 * Gets the control points that describe a bezier ease points from a bodymovin keyframe.
 *
 * @param      {object}  keyframe           The keyframe object from bodymovin
 * @param      {number}  [propertyIndex=0]  The property index (because bodymovin tweens can store multiple properties)
 * @returns     {Array}   The bezier ease points from bodymovin.
 * @memberof LayerDataParsing
 * @public
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
 * TODO: Remove this from the `manifest` directory
 *
 * @deprecated
 *
 * @param      {string[]}    propertyNames                     The property names
 * @param      {object}    keyframes                           The keyframes object from bodymovin
 * @param      {Timeline}    timeline                          The timeline to add the tweens to
 * @param      {Function}  [transformFunction=(value)=>value]  A transform function, if the data needs to be converted for PIXI
 * @memberof LayerDataParsing
 * @public
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

const orderTweensByTime = (tweens = []) => {
    tweens.sort(({
        t: aTime
    }, {
        t: bTime
    }) => aTime - bTime);
};

/**
 * Adds tweens for a layer's property, overwriting tweens that occur at the time if selected
 *
 * @param      {object}  layerData  The video data for layer
 * @param      {string}  property   The property
 * @param      {object[]}  tweens      The tween
 * @memberof LayerDataParsing
 * @public
 */
export function spliceTweensForProperty(layerData, property, tweens = []) {
    orderTweensByTime(tweens);
    let existingProperty = layerData[property];

    // if the existing property does not exist, we'll have to create it with the first tween's starting value
    if (!existingProperty) {
        existingProperty = {
            k: tweens[0].s,
            a: 0,
        };
        // eslint-disable-next-line no-param-reassign
        layerData[property] = existingProperty;
    }

    // if the existing property tween is not animated, we'll have to create a fake tween to begin with
    if (!existingProperty.a) {
        const startingValue = Array.isArray(existingProperty.k) ?
            existingProperty.k :
            [existingProperty.k];

        existingProperty.k = [{
            s: startingValue,
            h: 1,
            t: 0,
        }, ];

        existingProperty.a = 1;
    }

    const tweensTimeStart = tweens[0].t;
    const tweensTimeEnd = tweens[tweens.length - 1].t;

    // Remove any tweens inbetween the spliced tweens
    _.remove(existingProperty.k, ({
        t
    }) => t >= tweensTimeStart && t <= tweensTimeEnd);

    // Add the tweens to the property
    existingProperty.k.push(...tweens);

    // Sort the tweens by starting time
    orderTweensByTime(existingProperty.k);
}

/**
 * Finds the initial values of a property by searching through its tweens
 *
 * @param      {object}   properties                  The properties
 * @returns     {object}   The initial properties.
 * @memberof LayerDataParsing
 * @public
 */
export function getInitialProperties(properties) {
    // If it's not animated, just return the properties back
    if (!properties.a) {
        return properties;
    }
    const {
        k: keyframes
    } = properties;

    // The first keyframe
    const [keyframe] = keyframes;

    // If our value is an array (it's not the last tween), and it has more than one value in it, we can assume
    // the value is for a multidimentional property (position, scale, pivot)
    const isMultidimensional = Array.isArray(keyframe.s) && keyframe.s.length > 1;
    const usableProperties = keyframe.s;

    // If this isn't a multidimensional property, just return the first value, flat.
    // This way, we represent the property as if it was exported without tweens by bodymovin
    if (!isMultidimensional && Array.isArray(usableProperties)) {
        return {
            k: usableProperties[0]
        };
    }

    // Otherwise return what we have
    return {
        k: usableProperties
    };
}

/**
 * Gets the property for a layer at time.
 *
 * @param      {object}         layerData                   The layer data
 * @param      {string}         bodymovinPropertyName       The bodymovin property name ex: 's' = scale
 * @param      {number}         time                        The time to get
 * @param      {number | string}  [tweenPropertyName=0]          Which property to select (either a name or an index)
 * The index of the property (for multi-dimensional properties) ex: 'a' = anchor/pivot. For the 'x' value, use 0, for 'y' use 1
 * If the property has separate tweens for each dimension, (indicated by an 's' in the property object) use a string. ex: 'p' = position. For the 'x' value, use 'x', for 'y' use 'y'
 * @param      {Function}       [transformFunction=()=>{}]  The transform function
 * @returns     {*}              The property at the time.
 * @memberof LayerDataParsing
 * @public
 */
export function getPropertyAtTime(
    layerData,
    bodymovinPropertyName,
    time,
    tweenPropertyName = 0,
    transformFunction = () => {},
) {
    let property;
    let propertyValues;

    if (_.isString(tweenPropertyName)) {
        property = layerData[bodymovinPropertyName][tweenPropertyName];
        // We only care about the first value in this case
        propertyValues = [tweenPropertyName];
    } else {
        property = layerData[bodymovinPropertyName];
        // Make an array of [0, 1, 2, ...] so we can reference the correct index
        propertyValues = [...Array(tweenPropertyName + 1).keys()];
    }

    if (!property) {
        throw Error(`Property '${bodymovinPropertyName}' not found for layer '${layerData.nm}'`);
    }

    // If the property isn't animated, it's just the value
    if (!property.a) {
        return property.k;
    }

    // Make a temporary timeline to analyze the value at a given time
    const timeline = new Timeline();

    applyTween(propertyValues, property, timeline, transformFunction);

    return timeline.getPropertyAtTime(tweenPropertyName, time);
}

/**
 * Removes tweens for property at a given time
 *
 * @param      {object}  layerData     The layer data
 * @param      {string}  propertyPath  The bodymovin property path ex: 'p' or 'p.x'
 * @param      {number}  tweenTime     The tween time
 * @memberof LayerDataParsing
 * @public
 */
export function removeTweenForPropertyAtTime(layerData, propertyPath, tweenTime) {
    const existingProperty = _.get(layerData, propertyPath);

    // if the existing property tween is not animated, we don't have to do anything
    if (!existingProperty || !existingProperty.a) {
        return;
    }
    const removedTweens = _.remove(existingProperty.k, ({
        t
    }) => t === tweenTime);

    // if we now only have one value for the property convert it to a non-animated property
    if (existingProperty.k.length === 1) {
        existingProperty.k = existingProperty.k[0].s;
        existingProperty.a = 0;
        // If we removed all the tweens, use the last one as the non-animated property
    } else if (existingProperty.k.length === 0) {
        existingProperty.k = removedTweens[removedTweens.length - 1].s;
        existingProperty.a = 0;
    }
}

/**
 * Pulls out specific properties related to a layer's content. Used for modifications to image and video textures
 *
 * @param {object} layerData The layer data
 * @param {string} layerData.contentBackgroundFill The content's background fill color
 * @param {object} layerData.contentCropping The content's cropping object
 * @param {number} layerData.contentCropping.x The cropping x position
 * @param {number} layerData.contentCropping.y The cropping y position
 * @param {number} layerData.contentCropping.width The cropping width
 * @param {number} layerData.contentCropping.height The cropping height
 * @param {number} layerData.contentPadding The content's padding value
 * @param {string} layerData.contentFit The content's fit type
 * @param {object} layerData.contentZoom The content's zoom object
 * @param {number} layerData.contentZoom.x The content's zoom focus point on the texture. A unitless number representing the proportion of the width (0.0 -> 1.0)
 * @param {number} layerData.contentZoom.y The content's zoom focus point on the texture. A unitless number representing the proportion of the hight (0.0 -> 1.0)
 * @param {number} layerData.contentZoom.z The content's zoom. A number repressenting to amount to zoom in (ex: 1.0 is no zoom, 2.0 is 2x zoom)
 * @param {string} layerData.contentFitFillAlignment The alignment of the content in its frame
 * @returns {object} An object of relevant properties
 * @memberof LayerDataParsing
 * @public
 */
export function getContentPropertiesFromLayerData(layerData) {
    // using pickBy's default itentity object to remove undefinied entries
    const contentProperties = _.pickBy({
        backgroundFill: layerData.contentBackgroundFill,
        cropping: layerData.contentCropping,
        padding: layerData.contentPadding,
        fit: layerData.contentFit,
        zoom: layerData.contentZoom,
        fitFillAlignment: layerData.contentFitFillAlignment || layerData.fitFillAlignment,
    });

    return contentProperties;
}

/**
 * Creates a layer for a passed composition and adds it to the composition
 *
 * @param {object} compositionData The composition to create the layer data for
 * @param {number} layerType The numerical representation of the layer to be created
 * @param {object} layerContent Additional layer content (overrides defaults)
 * @returns {object} The created layer object
 */
export function createLayerData(compositionData, layerType, layerContent = {}) {
    // Default layerData properties
    const defaultLayerData = {
        ind: compositionData.layers.length,
        hasMotionBlur: false,
        hasCollapseTransformation: false,
        // 3D
        ddd: 0,
        meta: {},
        // Blend Mode
        bm: 0,
        w: 100,
        h: 100,
        ty: layerType,
        // In Point
        ip: compositionData.ip,
        // Out Point
        op: compositionData.op,
        // Start Time
        st: 0,
        // Layer time stretching
        sr: 1,
        // Auto-Orient
        ao: 0,
        // Transform properties
        ks: {
            // Opacity
            o: {
                a: 0,
                k: 0,
                ix: 11,
            },
            // Rotate
            r: {
                a: 0,
                k: 0,
                ix: 10,
            },
            // Position
            p: {
                a: 0,
                k: [compositionData.w / 2, compositionData.h / 2, 0],
                ix: 2,
            },
            // Anchor/Pivot
            a: {
                a: 0,
                k: [0, 0, 0],
                ix: 1,
            },
            // Scale
            s: {
                a: 0,
                k: [100, 100, 100],
                ix: 6,
            },
        },
    };

    let layerTypeData = {};
    switch (layerType) {
        case layerTypes.audio:
            layerTypeData = {
                masterVolume: 1.0,
                isMuted: false,
                volume: {
                    a: 0,
                    k: 1.0,
                },
            };
            break;
        default:
            break;
    }

    const layerData = {
        ...defaultLayerData,
        ...layerTypeData,
        ...layerContent,
    };

    compositionData.layers.push(layerData);

    return layerData;
}

/**
 * Deletes a layer for a passed composition
 *
 * @example
 *  deleteLayerData(videoData, '#myIdName')
 *  deleteLayerData(videoData, '0123-myuuid-2345')
 *  deleteLayerData(videoData, (layer)=>layer.nm==='My Layer Name')
 *
 * @param {object} compositionData The composition to create the layer data for
 * @param {Function|object|Array|string} predicate A predicate function, object, or a string representing the id or uuid of the layer to delete
 * @returns {object[]} And array of removed layers
 */
export function deleteLayerData(compositionData, predicate) {
    const predicateExpression = getPredicateExpression(predicate);
    return _.remove(compositionData.layers, predicateExpression);
}