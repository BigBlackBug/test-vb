import _ from 'lodash';
import {
    DropShadowFilter
} from '@pixi/filter-drop-shadow';
import {
    transformColorArray
} from '../../utils/index.js';
import {
    applyTween
} from '../tweens.js';
import settings, {
    effects,
    effectQuality
} from '../../settings.js';

// Drop shadow blur effects internally use a KawaseBlurFilter.
// The blur quality for this filter (0-20) becomes the number of kernels, which
// in turn determines the number of unique shades of grey in a blurred shadow.
// So, values below 5ish look pretty blocky on large shadows.
const DROP_SHADOW_KERNEL_QUALITY = {
    // High value 15 copied from MOTION_BLUR_KERNEL_QUALITY
    [effectQuality.high]: 15,
    // Medium value 9 copied from MOTION_BLUR_KERNEL_QUALITY
    // Low value 7 looks good enough without compromising too much performance
    [effectQuality.medium]: 7,
    // MOTION_BLUR_KERNEL_QUALITY has low value 5
    [effectQuality.low]: 5,
};

/**
 * Applies the "Drop Shadow" effect to an object.
 * @param      {pixi.js.DisplayObject}  displayObject  The display object
 * @param      {object}                 effect         The effect data from bodymovin
 * @param      {Timeline}      timeline       The timeline (for animations)
 */
// eslint-disable-next-line import/prefer-default-export
export function applyDropShadowToObject(displayObject, effect, timeline) {
    if (settings.DISABLED_EFFECTS.includes(effects.dropShadow)) {
        return;
    }

    let effectObject;
    const effectIndex = effect.ix;
    if (displayObject.effects[effectIndex]) {
        effectObject = displayObject.effects[effectIndex];
    } else {
        const quality = DROP_SHADOW_KERNEL_QUALITY[settings.EFFECT_QUALITY];
        effectObject = new DropShadowFilter({
            quality
        });
        /* eslint-disable-next-line no-param-reassign */
        displayObject.effects[effectIndex] = effectObject;
    }

    const filterProperties = [];

    // Loop through our effect properties and construct the values to be used by the filter.
    effect.ef.forEach((effectProperty) => {
        const filterProperty = {
            value: effectProperty.v,
        };

        switch (effectProperty.nm) {
            case 'Shadow Color':
                filterProperty.name = 'color';
                filterProperty.transformFunction = transformColorArray;

                /*
                TODO: FIXME Look the other way, this aint pretty!
                The color value as exported by bodymovin is an array. When inside a keyframe,
                the start and end values are generally wrapped in an array. But for color (I suppose
                because it's already an array?), that extra array wrapping isn't happening. So I'm adding
                that here so we can rely on the same tween utilities for color that we do for all other
                properties. A cleaner fix might be in bodymovin? For now, this works.
                 */
                if (filterProperty.value.a) {
                    filterProperty.value.k = filterProperty.value.k.map((keyframe) => {
                        // The last keyframe will likely just be a `t` value.
                        if (!keyframe.s || !keyframe.e) {
                            return keyframe;
                        }

                        return {
                            ...keyframe,
                            s: [keyframe.s],
                            e: [keyframe.e],
                        };
                    });
                }
                break;

            case 'Opacity':
                filterProperty.name = 'alpha';
                // Drop shadow `opacity` is exported as a number on a range from 0 to 255.
                filterProperty.transformFunction = (value) => value / 255;
                break;

            case 'Direction':
                filterProperty.name = 'rotation';
                // AE treats 0 as 12 oclock, Pixi treats 0 as 3 oclock (shrug).
                filterProperty.transformFunction = (value) => value - 90;
                break;

            case 'Distance':
                filterProperty.name = 'distance';
                filterProperty.transformFunction = _.identity;
                break;

            case 'Softness':
                filterProperty.name = 'blur';
                /* The `softness` setting in AE doesn't have a direct corollary in the Pixi blur
                filter options, but we use the softness value (exported on a scale of 0 - 250)
                to set the `blur` property on the DropShadowFilter (on an invented scale of 0 - 20,
                determined by the eye test). */
                filterProperty.transformFunction = (value) => (value / 250) * 20;
                break;

            case 'Shadow Only':
                filterProperty.name = 'shadowOnly';
                filterProperty.transformFunction = (value) => value === 1;
                break;

            default:
                {
                    break;
                }
        }

        filterProperties.push(filterProperty);
    });

    // For each filter property, apply the value (or the tween) to the filter.
    filterProperties.forEach((property) => {
        const {
            name,
            value,
            transformFunction
        } = property;

        // Use a tween if the property is animated.
        if (property.value.a) {
            applyTween([`effects[${effectIndex}].${name}`], value, timeline, transformFunction);
            // Otherwise, just set the property.
        } else {
            effectObject[name] = transformFunction(value.k);
        }
    });

    displayObject.addFilters(effectObject);
}