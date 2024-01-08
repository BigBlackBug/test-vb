import {
    filters
} from 'pixi.js';
import {
    applyTween
} from '../../manifest/index.js';
import {
    matrixIndeces
} from './constants.js';

const {
    ColorMatrixFilter
} = filters;

/**
 * Applies the "Fill" effect to a display object.
 * @param      {pixi.js.DisplayObject}  displayObject  The display object
 * @param      {object}                 effect         The effect data from bodymovin
 * @param      {Timeline}      timeline       The timeline (for animations)
 */
/* eslint-disable-next-line import/prefer-default-export */
export function applyFillEffectToObject(displayObject, effect, timeline) {
    let effectObject;
    const effectIndex = effect.ix;
    if (displayObject.effects[effectIndex]) {
        effectObject = displayObject.effects[effectIndex];
    } else {
        effectObject = new ColorMatrixFilter();
        /* eslint-disable-next-line no-param-reassign */
        displayObject.effects[effectIndex] = effectObject;
    }

    let color;
    let opacity;

    /* Loop through our effect properties and construct the values to be used by the filter.
    TODO: Only supporting `color` and `opacity` values right now, and we do not currently support
    multiple fill effects on a single diplay object, despire that being a valid thing in AE. */
    effect.ef.forEach((effectProperty) => {
        switch (effectProperty.nm) {
            case 'Fill Mask':
                break;

            case 'All Masks':
                break;

            case 'Color':
                color = effectProperty.v;
                break;

            case 'Invert':
                break;

            case 'Horizontal Feather':
                break;

            case 'Vertical Feather':
                break;

            case 'Opacity':
                opacity = effectProperty.v;
                break;

            default:
                break;
        }
    });

    // NOTE / TODO: we should be attempting to use `applyValueFromEffectProperty` here
    // for consistency, but that utility needs to be modified before it works
    // as a drop-in here. Until then, we'll use a more verbose solution.
    const colorValue = color.a ? color.k[0].s : color.k;
    const [red, green, blue] = colorValue;
    const opacityValue = opacity.a ? opacity.k[0].s[0] : opacity.k;

    // Create an array of length 20 for the the 4x5 matrix expected by ColorMatrixFilter.
    const matrixTransformation = new Array(20).fill(0);
    matrixTransformation[matrixIndeces.red] = red;
    matrixTransformation[matrixIndeces.green] = green;
    matrixTransformation[matrixIndeces.blue] = blue;
    matrixTransformation[matrixIndeces.alpha] = opacityValue;
    effectObject.matrix = matrixTransformation;

    // Apply the opacity tween if needed
    if (opacity && opacity.a) {
        applyTween([`effects[${effectIndex}].matrix[${matrixIndeces.alpha}]`], opacity, timeline);
    }

    displayObject.addFilters(effectObject);
}