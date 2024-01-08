import _ from 'lodash';

/**
 * Creates linked properties for use in a track matte. The source object will
 * supply properties for the desitination object (but only in one direction)
 *
 * @param      {pixijs.DisplayObject}  sourceObject       The source object
 * @param      {pixijs.DisplayObject}  destinationObject  The destination object
 * @param      {string[]}              properties         The properties names
 */
function createLinkedProperties(sourceObject, destinationObject, ...properties) {
    properties.forEach((property) => {
        Object.defineProperty(destinationObject, property, {
            // Don't allow the destination object to override the source object
            set: () => {},
            get: () => sourceObject[property],
        });
    });
}

/**
 *
 */
export function applyRedChannel() {}
/**
 *
 */
export function applyGreenChannel() {}
/**
 *
 */
export function applyBlueChannel() {}
/**
 *
 */
export function applyAlphaChannel() {}
/**
 *
 */
export function applyLuminance() {}
/**
 *
 */
export function applyHue() {}
/**
 *
 */
export function applyLightness() {}
/**
 *
 */
export function applySaturation() {}
/**
 *
 */
export function applyFull() {}
/**
 *
 */
export function applyOff() {}

export const matteOperationTypes = {
    // Red Channel
    1: applyRedChannel,
    // Green Channel
    2: applyGreenChannel,
    // Blue Channel
    3: applyBlueChannel,
    // Alpha Channel
    4: applyAlphaChannel,
    // Luminance
    5: applyLuminance,
    // Hue
    6: applyHue,
    // Lightness
    7: applyLightness,
    // Saturation
    8: applySaturation,
    // Full
    9: applyFull,
    // Off
    10: applyOff,
};

/**
 * @param matteOperationIndex
 * @param displayObject
 */
export function useForMatteOperation(matteOperationIndex, displayObject) {
    matteOperationTypes[matteOperationIndex](displayObject);
}

/**
 * Applies the "Set Matte" effect to an object, giving the appearance of a mask.
 * NOTE: Currently only tested to work on mattes that are Graphics objects. (not tested on Sprites)
 *       Properties of the effect cannot be tweened.
 *       Seeing some issues with the mask accuracy (see test in test/effects/setMatte/setMatte.js)
 *
 * @param      {pixi.js.DisplayObject}  displayObject  The display object
 * @param      {object}                 effect         The effect data from bodymovin
 */
export function applySetMatteToObject(displayObject, effect) {
    // Loop through our effect properties to see what
    effect.ef.forEach((effectProperty) => {
        switch (effectProperty.nm) {
            case 'Take Matte From Layer':
                {
                    // TODO: Support Tweened Layer matte

                    const matteLayerIndex = effectProperty.v.k;

                    const containerObject = displayObject.parent;
                    // Get the matte layer that we will be using for the mask
                    const matteLayer = containerObject.bodymovinLayerIndex[matteLayerIndex];
                    if (!matteLayer) {
                        console.error(
                            `Matte layer for set matte effect for layer ${
              displayObject.name
            }: ${displayObject.waymarkId || displayObject.waymarkUUID} was not exported`,
                        );
                        return;
                    }

                    // Make a mask object that is linked to the original matteLayer's properties
                    const maskObject = new matteLayer.constructor();
                    const maskObjectProperties = Object.keys(maskObject);
                    createLinkedProperties(
                        matteLayer,
                        maskObject,
                        ..._.without(maskObjectProperties, 'name', 'destroy'),
                    );
                    // Change the name for debugging purposes
                    maskObject.name = `${displayObject.name}__set_matte`;
                    // The object doesn't need to go through the same destroy routine because its linked
                    maskObject.destroy = () => {};

                    const matteObjectContainerIndex = containerObject.getChildIndex(matteLayer);
                    // Add the mask object to the container right above the existing matte layer
                    containerObject.addChildAt(maskObject, matteObjectContainerIndex + 1);
                    // Set the mask
                    /* eslint-disable-next-line no-param-reassign */
                    displayObject.mask = maskObject;
                    break;
                }
            case 'Use For Matte':
                {
                    // TODO: Currently only the Alpha Channel is supported for set matte
                    break;
                }
            case 'Invert Matte':
                {
                    // TODO: Support the ability for the matte to invert the shape of the layer
                    // (This will become easier to support it when we figure out a strategy for other masks)
                    break;
                }
            case 'If Layer Sizes Differ':
                {
                    // TODO: Support. Still need to figure out what this does.
                    break;
                }
            case 'Composite Matte with Original':
                {
                    // TODO: Support
                    // Composites the new matte with the current layer, rather than replacing it. (This is how this is currently being done, with this set to false, it operates like a normal mask)
                    // The resulting matte allows the image to show through only where the current matte and the new matte both have some opacity.
                    break;
                }
            case 'Premultiply Matte Layer':
                {
                    // TODO: Support
                    // Premultiplies the new matte layer with the current layer
                    break;
                }
            default:
                {
                    break;
                }
        }
    });
}