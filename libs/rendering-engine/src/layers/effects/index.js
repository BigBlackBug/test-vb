import {
    applyInvertToObject
} from './invert.js';
import {
    applyDropShadowToObject
} from './dropShadow.js';
import {
    applyFillEffectToObject
} from './fill.js';
import {
    applySetMatteToObject
} from './setMatte.js';

export {
    matrixIndeces
}
from './constants.js';

/**
 * Applies an effect to a display object based on a Bodymovin Export
 *
 * @param      {pixi.js.DisplayObject}  displayObject  The display object
 * @param      {object}                 effect         The effect data from bodymovin
 * @param      {Timeline}      timeline       The timeline (for animations)
 */
export function applyEffectToObject(displayObject, effect, timeline) {
    // Create a register of layer effects
    if (!displayObject.effects) {
        /* eslint-disable-next-line no-param-reassign */
        displayObject.effects = {};
    }

    // If the effect isn't enabled, don't apply it
    if (!effect.en) {
        return;
    }

    switch (effect.ty) {
        // group
        // This is a special case that can contain other effect types within it that
        // aren't distinguished by having their own effect type ID
        case 5:
            {
                if (effect.mn === 'ADBE Invert') {
                    applyInvertToObject(displayObject, effect, timeline);
                }
                break;
            }
            // tint
        case 20:
            {
                break;
            }
            // fill
        case 21:
            {
                applyFillEffectToObject(displayObject, effect, timeline);
                break;
            }
            // stroke
        case 22:
            {
                break;
            }
            // tritone
        case 23:
            {
                break;
            }
            // proLevels
        case 24:
            {
                break;
            }
            // dropShadow
        case 25:
            {
                applyDropShadowToObject(displayObject, effect, timeline);
                break;
            }
            // radialWipe
        case 26:
            {
                break;
            }
            // displacementMap
        case 27:
            {
                break;
            }
            // matte3
        case 28:
            {
                applySetMatteToObject(displayObject, effect, timeline);
                break;
            }
            // gaussianBlur2
        case 29:
            {
                break;
            }
            // twirl
        case 30:
            {
                break;
            }
            // mesh_warp
        case 31:
            {
                break;
            }
            // ripple
        case 32:
            {
                break;
            }
            // spherize
        case 33:
            {
                break;
            }
            // freePin3
        case 34:
            {
                break;
            }
        default:
            {
                break;
            }
    }
}