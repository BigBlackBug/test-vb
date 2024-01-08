import {
    filters
} from 'pixi.js';
import {
    applyValueFromEffectProperty
} from './effectProperties.js';

const {
    ColorMatrixFilter
} = filters;

// A map of the channel types to the different color matrices
const CHANNEL_MATRIX_MAP = {
    // Default (not used)
    0: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    // Inverts the Red, Green, and Blue channels
    1: [-1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, -1, 1, 0, 0, 0, 0, 1, 0],
    // Inverts just the Red channel
    2: [-1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    // Inverts just the Green channel
    3: [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    // Inverts just the Blue channel
    4: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, 0, 1, 0, 0, 0, 1, 0],
    // Inverts just the Alpha channel
    16: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, -1, 1],
    /**
     * Unsupported channels:
     *  - HSL
     *  - Hue
     *  - Lightness
     *  - Saturation
     *  - YIQ
     *  - Luminance
     *  - In Phanse Chominance
     *  - Quadrature Chrominance
     */
};

/**
 * Applies an "invert" effect to a layer. Inverts the specified color channels in the specified channel effect property
 *
 * @param      {pixi.DisplayObject}  displayObject  The display object
 * @param      {object}              effect         The effect data from bodymovin
 * @param      {Timeline}   timeline       The timeline
 */
// eslint-disable-next-line import/prefer-default-export
export function applyInvertToObject(displayObject, effect, timeline) {
    let effectObject;
    const effectIndex = effect.ix;
    if (displayObject.effects[effectIndex]) {
        effectObject = displayObject.effects[effectIndex];
    } else {
        effectObject = new ColorMatrixFilter();
        /* eslint-disable-next-line no-param-reassign */
        displayObject.effects[effectIndex] = effectObject;
    }

    // Filter padding isn't needed for color replacing, and adds a frame when messing with the alpha channel
    effectObject.padding = 0;
    displayObject.addFilters(effectObject);

    // Loop through our effect properties and construct the values to be used by the filter.
    effect.ef.forEach((effectProperty) => {
        switch (effectProperty.nm) {
            case 'Channel':
                {
                    applyValueFromEffectProperty(
                        effectIndex,
                        effectProperty,
                        effectObject,
                        'matrix',
                        (channelType) => CHANNEL_MATRIX_MAP[channelType] || CHANNEL_MATRIX_MAP[0],
                        timeline,
                    );
                    break;
                }
            case 'Blend With Original':
                {
                    applyValueFromEffectProperty(
                        effectIndex,
                        effectProperty,
                        effectObject,
                        'alpha',
                        (value) => (100 - value) / 100,
                        timeline,
                    );
                    break;
                }
            default:
                {
                    break;
                }
        }
    });
}