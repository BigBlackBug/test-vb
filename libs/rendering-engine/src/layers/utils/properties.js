/* eslint-disable no-param-reassign */

// Vendor
import _ from 'lodash';
import {
    BLEND_MODES,
    CompositionContainer,
    CompositionGraphics,
    filters,
    Point
} from 'pixi.js';

// Local
import settings, {
    effects
} from '../../settings.js';
import applyMotionBlur from '../motionBlur.js';
import {
    applyTween,
    getInitialProperties
} from '../../manifest/index.js';

/**
 * Apply a property from the Bodymovin export to a DisplayObject
 *
 * @param      {pixi.js.DisplayObject}  displayObject      The display object
 * @param      {string}                 propertyName       The property name
 * @param      {object}                 propertyValue      The property value as exported from bodymovin
 * @param      {Array | string | number}    propertyValue.k    The value to apply (either a single value or and array of values)
 * @param      {Function}               transformFunction  A function that can be applied to an exported property so it works with PixiJS
 *                                                         The function takes a single variable, the value and should return a transformed value
 */
export function applyProperty(
    displayObject,
    propertyName,
    propertyValue,
    transformFunction = (value) => value,
) {
    // If the property is an array, it's a "Multidimensional Value" and is represented by a Point
    // TODO: This does not account for color arrays, which are also Arrays, but should not be translated
    // into Point values.
    if (Array.isArray(propertyValue.k)) {
        displayObject[propertyName] = new Point(
            transformFunction(propertyValue.k[0], `${propertyName}X`),
            transformFunction(propertyValue.k[1], `${propertyName}Y`),
        );
        // Otherwise we can just assign it normally
    } else {
        displayObject[propertyName] = transformFunction(propertyValue.k, propertyName);
    }
}

/**
 * Apply visibility bounds to a display object
 *
 *
 * @param  {pixi.js.DisplayObject}  displayObject           The PIXI display object
 * @param  {number}                 inPointFrameNumber      The object's first visible (in) frame number
 * @param  {number}                 outPointFrameNumber     The object's last visible (out) frame number
 * @param  {Timeline}      timeline                The timeline (for animations)
 * @param  {boolean}                isMatteLayer            Whether this layer is being used as a Matte
 */
export function applyVisibilityBoundsToObject(
    displayObject,
    inPointFrameNumber,
    outPointFrameNumber,
    timeline,
    isMatteLayer,
) {
    // If the layer is used as a matte, it should not be visible!
    // If the object's out point is less than zero, it never shows up
    if (isMatteLayer || outPointFrameNumber <= 0) {
        displayObject.visible = false;
        return;
    }

    // Set the value to hidden before the in point
    timeline.addTween('visible', {
        valueStart: false,
        valueEnd: false,
        startTime: inPointFrameNumber - 1,
        duration: 0,
    });
    // Set the value to visible at the in point, and then hidden at the outpoint
    timeline.addTween('visible', {
        valueStart: true,
        valueEnd: false,
        startTime: inPointFrameNumber,
        duration: outPointFrameNumber - inPointFrameNumber,
    });
}

/**
 * Apply alpha properties from the Bodymovin export to a DisplayObject
 *
 * @param      {pixi.js.DisplayObject}  displayObject        The display object
 * @param      {object}                 transformProperties  An object of transform properties exported from bodymovin
 * @param      {Timeline}               timeline             The timeline (for animations)
 */
export function applyAlphaToObject(displayObject, transformProperties, timeline) {
    if (transformProperties.o) {
        let target;
        let tweenDotpath;

        if ([CompositionContainer, CompositionGraphics].includes(displayObject.constructor)) {
            // Setting the alpha directly on a container has the same effect as
            // setting the alpha on each child of the container. This is intentional,
            // and doesn't behave how we'd expect: https://github.com/pixijs/pixi.js/issues/4334
            // The official workaround is to create an alpha filter for the
            // container.
            const alphaFilter = new filters.AlphaFilter();
            target = alphaFilter;
            // TODO: A potential optimization for antialiasing is the turning on/off these alpha filters
            //       when the alpha is 1. However the enabling/disabling of filters has caused some problems
            //       In templates (specifically Instant). Investigate further if turning on and off filters
            //       is acceptable use of the filter API
            //       We also need the alphaFilter to deal with mask edges in places like frame 190 in criterion.
            // Replace the existing filter if it exists
            if (displayObject.alphaFilter) {
                const index = displayObject.filters.indexOf(displayObject.alphaFilter);
                displayObject.filters.splice(index, 1, alphaFilter);
                // Otherwise just add it
            } else {
                displayObject.addFilters(target);
            }

            // Assign the alphaFilter to the object so we can target it via a dotpath
            displayObject.alphaFilter = alphaFilter;
            tweenDotpath = 'alphaFilter.alpha';
        } else {
            target = displayObject;
            tweenDotpath = 'alpha';
        }

        const alphaTransformFunction = (value) => value * 0.01;

        const initialAlpha = getInitialProperties(transformProperties.o);
        // Bodymovin opacity represents 100% as 100, PixiJS represents that as 1
        applyProperty(target, 'alpha', initialAlpha, alphaTransformFunction);

        // Animated?
        if (transformProperties.o.a) {
            applyTween(
                [tweenDotpath],
                transformProperties.o,
                timeline,
                // Bodymovin opacity represents 100% as 100, PixiJS represents that as 1
                alphaTransformFunction,
            );
        }
    }
}

/**
 * Apply transform properties from the Bodymovin export to a DisplayObject
 *
 * @param      {pixi.js.DisplayObject}  displayObject        The display object
 * @param      {object}                 transformProperties  An object of transform properties exported from bodymovin
 * @param      {Timeline}               timeline             The timeline (for animations)
 */
export function applyTransformsToObject(displayObject, transformProperties, timeline) {
    // Pivot
    if (transformProperties.a) {
        const initialPivot = getInitialProperties(transformProperties.a);
        applyProperty(displayObject, 'pivot', initialPivot);

        // Animated?
        if (transformProperties.a.a) {
            applyTween(['pivot.x', 'pivot.y'], transformProperties.a, timeline);
        }
    }

    // Position
    if (transformProperties.p) {
        // Has separated dimensions?
        if (transformProperties.p.s) {
            // X Position
            const initialXPosition = getInitialProperties(transformProperties.p.x);
            applyProperty(displayObject, 'x', initialXPosition);

            // Animated?
            if (transformProperties.p.x.a) {
                applyTween(['position.x'], transformProperties.p.x, timeline);
            }

            // Y Position
            const initialYPosition = getInitialProperties(transformProperties.p.y);
            applyProperty(displayObject, 'y', initialYPosition);

            // Animated?
            if (transformProperties.p.y.a) {
                applyTween(['position.y'], transformProperties.p.y, timeline);
            }

            /**
             * Z position for 3d layers. Check for p.z because it will be undefined for 2d layers.
             * This code won't work because `positionZ` isn't a valid Greensock alias.
             * if (transformProperties.p.z) {
             *   // Z Position
             *   const initialZPosition = transformProperties.p.z.a ? transformProperties.p.z.k[0].s[0] : transformProperties.p.z;
             *   applyProperty(displayObject, 'z', initialZPosition);
             *
             *   // Animated?
             *   if (transformProperties.p.z.a) {
             *     applyTween(['position.z'], transformProperties.p.z, timeline)
             *   }
             * }
             */
        } else {
            const initialPosition = getInitialProperties(transformProperties.p);
            applyProperty(displayObject, 'position', initialPosition);

            if (transformProperties.p.a) {
                // Animated?
                applyTween(['position.x', 'position.y'], transformProperties.p, timeline);
            }
        }
    }

    // Scale
    if (transformProperties.s) {
        const initialScale = getInitialProperties(transformProperties.s);
        // Bodymovin scale represents 100% as 100, PixiJS represents that as 1
        applyProperty(displayObject, 'scale', initialScale, (value) => value * 0.01);

        // Animated?
        if (transformProperties.s.a) {
            applyTween(['scale.x', 'scale.y'], transformProperties.s, timeline, (value) => value * 0.01);
        }
    }

    // Skew
    if (transformProperties.sk) {
        const initialSkew = getInitialProperties(transformProperties.sk);
        // TODO: Need to account for `applyProperty` here? It's weird because "sk" and "sa" map to "skew.x" and "skew.y". This sort of breaks
        // the `applyProperty` paradigm.
        displayObject.skew.x = initialSkew.k * -1 * (Math.PI / 180);

        // Animated?
        if (transformProperties.sk.a) {
            applyTween(['skew.x'], transformProperties.sk, timeline, (value) => -1 * value * (Math.PI / 180));
        }
    }

    // Skew Axis
    if (transformProperties.sa) {
        const initialSkewAxis = getInitialProperties(transformProperties.sa);
        // TODO: Need to account for `applyProperty` here? It's weird because "sk" and "sa" map to "skew.x" and "skew.y". This sort of breaks
        // the `applyProperty` paradigm.
        displayObject.skew.y = initialSkewAxis.k * (Math.PI / 180);

        // Animated?
        if (transformProperties.sa.a) {
            applyTween(['skew.y'], transformProperties.sa, timeline, (value) => value * (Math.PI / 180));
        }
    }

    // Rotation
    if (transformProperties.r) {
        const initialRotation = getInitialProperties(transformProperties.r);
        applyProperty(
            displayObject,
            'rotation',
            initialRotation,
            // Bodymovin is in degrees, PixiJS is in radians
            (value) => value * (Math.PI / 180),
        );

        // Animated?
        if (transformProperties.r.a) {
            // Bodymovin is in degrees, PixiJS is in radians
            applyTween(['rotation'], transformProperties.r, timeline, (value) => value * (Math.PI / 180));
        }
    }

    // Alpha
    applyAlphaToObject(displayObject, transformProperties, timeline);
}

/**
 * Mapping between Bodymovin blend mode values and the name of the PixiJS
 * blendModes to reference in the implementing code.
 * (For the curious, YES, they are different. E.g. MULTIPLY is `1` in BM, but `2` in Pixi)
 * TODO: Move to manifest export
 */
const BODYMOVIN_BLEND_MODES = {
    // SUPPORTED blend modes:
    0: 'NORMAL',
    1: 'MULTIPLY',
    2: 'SCREEN',

    // UNSUPPORTED blend modes:
    3: 'OVERLAY',
    4: 'DARKEN',
    5: 'LIGHTEN',
    6: 'COLOR_DODGE',
    7: 'COLOR_BURN',
    8: 'HARD_LIGHT',
    9: 'SOFT_LIGHT',
    10: 'DIFFERENCE',
    11: 'EXCLUSION',
    12: 'HUE',
    13: 'SATURATION',
    14: 'COLOR',
    15: 'LUMINOSITY',

    /* Blend mode options that show up in AfterEffects, but are not exported by bodymovin:
      - ADD
      - SUBTRACT
     */
};

/**
 * You cannot specify blend mode for a normal Container. Instead we use the workaround
 * suggested here: https://github.com/pixijs/pixi.js/wiki/v4-Gotchas#no-container-blend-mode-support
 *
 * @param      {PIXI.DisplayObject}  displayObject  The display object
 * @param      {number}              blendMode      The pixi blend mode
 */
export function applyBlendModeToContainer(displayObject, blendMode) {
    const blendFilter = new filters.AlphaFilter();
    blendFilter.blendMode = blendMode;

    // Replace the existing filter if it exists
    if (displayObject.blendModeFilter) {
        const index = displayObject.filters.indexOf(displayObject.blendModeFilter);
        displayObject.filters.splice(index, 1, blendFilter);
        // Otherwise just add it
    } else {
        displayObject.addFilters(blendFilter);
    }

    displayObject.blendModeFilter = blendFilter;
}

/**
 * Applies the blend mode with the given bodymovin numeric value to the provided displayObject.
 *
 * @param  {pixijs.DisplayObject}  displayObject      The display object
 * @param  {number}                bodymovinBlendMode Bodymovin blend mode value
 */
export function applyBlendMode(displayObject, bodymovinBlendMode) {
    const pixiBlendModeName = BODYMOVIN_BLEND_MODES[bodymovinBlendMode];
    const pixiBlendMode = BLEND_MODES[pixiBlendModeName];

    // 0 is a valid value here, so only check for undefined.
    if (pixiBlendMode === undefined) {
        console.warn(
            `Could not find blend mode: BM value: ${bodymovinBlendMode}, pixi name ${pixiBlendModeName}`,
        );
        return;
    }

    // NOTE: I'm comparing the contructor directly here rather than using `instanceof` because
    // the latter is too inclusive -> Graphics and Sprite both inherit from Container, e.g.
    if (
        ([CompositionContainer, CompositionGraphics].includes(displayObject.constructor) ||
            displayObject.mediaRedraw) &&
        pixiBlendMode !== BLEND_MODES.NORMAL
    ) {
        applyBlendModeToContainer(displayObject, pixiBlendMode);
    } else {
        displayObject.blendMode = pixiBlendMode;
    }
}

/**
 * Apply properties relevant to a DisplayObject from the Bodymovin export to a DisplayObject
 *
 * @param      {pixi.js.DisplayObject}  displayObject
 * The display object
 * @param      {object}                 layerData
 * An object of properties to apply to the Display Object from the bodymovin export
 * @param      {Timeline}      timeline
 * The timeline (for animations)
 */
export function applyDisplayObjectProperties(displayObject, layerData, timeline) {
    displayObject.name = layerData.nm;
    if (layerData.waymarkId) {
        displayObject.waymarkId = layerData.waymarkId;
    }

    displayObject.layerTimeline = timeline;

    const inPointFrameNumber = layerData.ip;
    const outPointFrameNumber = layerData.op;

    // We need to handle the visibility of matte layers differently.
    const isMatteLayer = layerData.td === 1;

    applyVisibilityBoundsToObject(
        displayObject,
        inPointFrameNumber,
        outPointFrameNumber,
        timeline,
        isMatteLayer,
    );

    if (layerData.ks) {
        const transformProperties = layerData.ks;
        applyTransformsToObject(displayObject, transformProperties, timeline);
    }

    /* NOTE: We're able to simply check truthiness here because `0` is not a blend mode value
    used in bodymovin. */
    if (layerData.bm) {
        applyBlendMode(displayObject, layerData.bm);
    }

    // TODO:
    // skew
    //
    // Potential Support?:
    // renderable
    // transform
    // visible

    // Apply the motion blur to the object (if it already has one)
    if (
        layerData.hasMotionBlur &&
        // Only apply motion blur if the layer isn't a track matte
        !layerData.td &&
        !settings.DISABLED_EFFECTS.includes(effects.motionBlur) &&
        // Only apply motion blur if the layer doesn't have collapseTransformation turned on
        !layerData.hasCollapseTransformation &&
        // Only attempt to recreate the motion blur if we've already made one
        // (we do this at the end of createCompositionFromLayer in composition.js)
        displayObject.motionBlurFilter
    ) {
        applyMotionBlur(displayObject, timeline);
    }
}

/**
 * Gets the tweens of that affect the properties supplied as the dotpath.
 *
 * @param      {GSAP.TweenLite[]}  tweens                 The tweens
 * @param      {string[]}          tweenPropertyDotpaths  An array of tween property dotpaths
 * @returns     {Array}   The tweens of tweens that affect these properties.
 */
export function filterTweensOfProperties(tweens, tweenPropertyDotpaths) {
    return tweens.filter((tween) => {
        let hasProperty = false;
        // Check the tween against each dot path
        tweenPropertyDotpaths.forEach((tweenPropertyDotpath) => {
            hasProperty = _.hasIn(tween.vars, tweenPropertyDotpath);
        });

        // If the tween has a property that matches the dotpath to check, we will use it
        return hasProperty;
    });
}

/**
 * Applies relevant audio properties to a layer object and its audio medfrom the layer data
 *
 * @param      {PIXI.DisplayObject}  layerObject        The layer object
 * @param      {object}              layerData          The layer data from bodymovin
 * @param      {AudioMediaHandler}   audioMediaHandler  The audio media handler
 * @param      {Timeline}            timeline           The layer timeline
 */
export const applyLayerAudioProperties = (layerObject, layerData, audioMediaHandler, timeline) => {
    // eslint-disable-next-line no-param-reassign
    layerObject.audioMediaHandler = audioMediaHandler;

    // Set the master volume on the handler
    // eslint-disable-next-line no-param-reassign
    audioMediaHandler.masterVolume = layerData.masterVolume || 1;

    // Set the isMuted property on the handler
    if (layerData.isMuted) {
        audioMediaHandler.mute();
    } else {
        audioMediaHandler.unmute();
    }

    // Set the volume changes on the handler and timeline
    const volumeProperty = layerData.volume;
    if (volumeProperty) {
        const initialProperty = getInitialProperties(volumeProperty);
        applyProperty(audioMediaHandler, 'volume', initialProperty);
        if (volumeProperty.a) {
            applyTween(['audioMediaHandler.volume'], volumeProperty, timeline);
        }
    }
};

export const applyTimeRemapProperties = (layerObject, layerData, timeline) => {
    // Set the time remap changes on the timeline
    const timeRemapProperty = layerData.tm;
    if (timeRemapProperty) {
        const initialProperty = getInitialProperties(timeRemapProperty);

        // TODO: Support Time remap on compositions
        // if (layerObject.compositionTimeline) {
        //   applyProperty(layerObject.compositionTimeline, 'currentTime', initialProperty);
        //   if (timeRemapProperty.a) {
        //     applyTween([`compositionTimeline.currentTime`], timeRemapProperty, timeline);
        //   }
        // }

        applyProperty(layerObject, 'timeRemap', initialProperty);
        if (timeRemapProperty.a) {
            applyTween(['timeRemap'], timeRemapProperty, timeline);
        }
    }
};