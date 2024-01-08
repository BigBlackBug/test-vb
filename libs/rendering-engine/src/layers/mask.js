/* eslint-disable no-param-reassign */
// Vendor
import {
    Graphics,
    Rectangle
} from 'pixi.js';

// Local
import {
    applyPathPropertiesFromBodymovin,
    getVerticiesOfPath
} from './shapes/index.js';
import {
    applyAlphaToObject,
    applyDisplayObjectProperties
} from './utils/index.js';
import {
    Timeline
} from '../timeline/index.js';

export const maskModes = {
    add: 'a',
    subtract: 's',
    intersect: 'i',
    lighten: 'l',
    darken: 'd',
    difference: 'f',
    none: 'n',
};

export const trackMatteTypes = {
    alpha: 1,
    alphaInverted: 2,
    luma: 3,
    lumaInverted: 4,
};

/**
 * Update the path of the drawn mask
 *
 * @param      {PIXI.DisplayObject}  displayObject           The display object the mask is applied to
 * @param      {PIXI.Graphics}       masksContainer          The masks container
 * @param      {object[]}            masks                   The masks and their callbacks
 * @param      {PIXI.Graphics}       masks[].mask            The individual child mask
 * @param      {function}            masks[].callback        The update callback for the child mask
 * @param      {boolean}             masks[].isMaskInverted  If the mask is inverted/subtract mask
 * @param      {string}              masks[].mode            The type of mask used
 */
const updateMaskGraphics = (displayObject, masksContainer, masks) => {
    // First we get a bounds rectangle of the object we're masking so we can use it
    // for dawing holes in the inverted add and subtract masks.
    // If the matte object has a parent, make sure it's updated,
    // so the matte will have a correct transform to render against
    if (displayObject.parent) {
        displayObject.parent.updateTransform();
        // Otherwise, just make sure the transform itself as up-to-date as it can be
    } else {
        displayObject.updateTransform();
    }

    // Get the bounds of the display object, which are the outer edges used by the inverted or subtract masks
    const bounds = displayObject.getBounds().clone();

    // We'll create the bound rectangle in the first pass of the forEach
    // so we don't start by enlarging a rectangle at (0,0) and getting an
    // incorrctly sized box
    let maskBounds = null;
    masks.forEach(({
        mask
    }) => {
        const {
            x: pathX,
            y: pathY
        } = mask.pathBezierCurves.bbox();
        const boundingRectangle = new Rectangle(pathX.min, pathY.min, pathX.size, pathY.size);

        if (!maskBounds) {
            maskBounds = boundingRectangle;
        } else {
            maskBounds.enlarge(boundingRectangle);
        }
    });

    // Convert the mask paths to the global space so they match our bounds
    maskBounds.transformRectangle(displayObject.worldTransform);

    // TODO: We need to enlarge the overall bounds to include these masks drawing operations because
    //       of a PixiJS v5 bug that involves drawing holes. They are working on fixing it, but for now
    //       holes need to be contained within the bounds of the larger graphics drawing operation they are cutting.
    bounds.enlarge(maskBounds);

    // Convert everything back locally so our drawing operations are correct
    bounds.transformRectangle(displayObject.worldTransform.clone().invert());

    // Add some padding so we don't have problems with holes (Pixi v5 bug)
    bounds.pad(10, 10);
    const {
        x,
        y,
        width,
        height
    } = bounds;

    masks.forEach(({
        mask,
        callback,
        isMaskInverted,
        mode
    }, index) => {
        mask.clear();
        switch (mode) {
            // Adds to the current masking shape
            case maskModes.add:
                {
                    mask.beginFill();
                    if (isMaskInverted) {
                        mask.drawRect(x, y, width, height);
                        mask.beginHole();
                    }
                    callback(mask);
                    if (isMaskInverted) {
                        mask.endHole();
                    }
                    mask.endFill();
                    break;
                }
                // Subtracts from the current masking shape
                // TODO: Support subtract masks
            case maskModes.subtract:
                {
                    /**
                     * Previously, subtract masks were treated as the same as inverse mask, but they're
                     * slightly different. Below is a method for supporting them that doesn't work entirely
                     * with PixiJS v5 due to issues with beginHole.
                     */
                    // TODO: support inverted subtract masks
                    if (isMaskInverted) {
                        console.warn('Inverted subtact masks are not supported');
                        break;
                    }
                    if (index === 0) {
                        // If we have nothing before this assume is subtracts from the whole composition
                        mask.beginFill();
                        mask.drawRect(x, y, width, height);
                        mask.beginHole();
                        callback(mask);
                        mask.endHole();
                        mask.endFill();
                    } else {
                        // We need to loop through previous shapes and modify them
                        masks.slice(0, index).forEach((previousMaskData) => {
                            const previousMask = previousMaskData.mask;
                            // Cut a hole in the shape of the subtract mask from the previous mask
                            previousMask.beginHole();
                            callback(previousMask);
                            previousMask.endHole();
                        });
                    }

                    break;
                }
                // TODO: Support intersect masks
            case maskModes.intersect:
                {
                    break;
                }
                // TODO: Support lighten masks
            case maskModes.lighten:
                {
                    break;
                }
                // TODO: Support darken masks
            case maskModes.darken:
                {
                    break;
                }
                // TODO: Support difference masks
            case maskModes.difference:
                {
                    break;
                }
                // Doesn't mask anything, just expand to the bounds of the composition
            case maskModes.none:
                {
                    mask.beginFill(0x000000);
                    mask.drawRect(x, y, width, height);
                    mask.endFill();
                    break;
                }
            default:
                {
                    break;
                }
        }
    });

    // Now that we've update our mask, recalculate the bounds & drawing path
    masksContainer.calculateBounds();
    masksContainer.calculateVertices();
};

/**
 * Apply a layer's mask properties to a display object
 * TODO Features to support:
 *  - Mask Expansion (not the same thing as a scale, it subtly rounds the corners of the shape)
 *  - Mask Feather
 *  - Mask types other than "add" and "subtract"
 *
 * @param      {pixijs.DisplayObject}  displayObject  The display object
 * @param      {object}                layerData      The layer data from bodymovin
 * @param      {Timeline}              timeline       The timeline
 */
export function applyMaskToLayer(displayObject, layerData, timeline) {
    const layerDuration = layerData.op;

    // Make an outer mask object to hold all the child masks
    const masksContainer = new Graphics();
    masksContainer.objectToMask = displayObject;

    // Create a timeline for the mask
    const maskTimeline = new Timeline({
        target: masksContainer
    });
    // Add the mask timeline to the composition timeline
    timeline.addTimeline(maskTimeline, 0);
    masksContainer.layerTimeline = maskTimeline;

    // Make sure we add the mask as a direct sibling to the displayObject.
    const displayObjectIndex = displayObject.parent.children.indexOf(displayObject);
    displayObject.parent.addChildAt(masksContainer, displayObjectIndex + 1);

    // Set the mask
    displayObject.mask = masksContainer;

    // Make sure the mask follows the display object
    if (displayObject.waymarkLinkedParent) {
        /**
         * TODO: Currently if the displayObject we're masking has a linked parent, we need to
         * replicate the movement tweens of the displayObject itself using `applyDisplayObjectProperties`
         * and then setting the same linked parent.
         *
         * It would be great if we could just setLinkedParent to the displayObject, but it seems like
         * the transforms just don't line up.
         */
        applyDisplayObjectProperties(
            masksContainer,
            layerData,
            maskTimeline,
            masksContainer.layerTimeline,
        );
        masksContainer.setLinkedParent(displayObject.waymarkLinkedParent);
    } else {
        masksContainer.setLinkedParent(displayObject);
    }

    masksContainer.name = `${displayObject.name}__Mask`;

    const masks = [];
    layerData.masksProperties.forEach((maskData, index) => {
        const maskGraphics = new Graphics();
        maskGraphics.layerTimeline = new Timeline({
            target: maskGraphics
        });

        // Only make a shape if you have at least 2 points ()
        if (getVerticiesOfPath(maskData.pt) < 2) {
            return;
        }

        const shapeData = {
            ks: maskData.pt
        };

        // Format the mask points so that they are similar to a normal shape layer
        const {
            callback
        } = applyPathPropertiesFromBodymovin(
            maskGraphics,
            shapeData,
            maskTimeline,
            layerDuration,
        );

        // Apply the mask opacity property
        applyAlphaToObject(maskGraphics, maskData, maskGraphics.layerTimeline);

        maskGraphics.name = `${displayObject.name}__Mask_${index}`;
        masksContainer.addChild(maskGraphics);
        masks.push({
            callback,
            mask: maskGraphics,
            mode: maskData.mode,
            isMaskInverted: maskData.inv,
        });
    });

    // TODO: Optimization pass, only perform update callback when both the mask and content are animated
    maskTimeline.registerHookCallback(
        Timeline.hookNames.rendering,
        updateMaskGraphics.bind(null, displayObject, masksContainer, masks),
    );

    updateMaskGraphics(displayObject, masksContainer, masks);
    masksContainer.updateMaskGraphics = updateMaskGraphics;

    return masksContainer;
}

/**
 * A regular update callback to make sure the track matte is correct before it is rendered by Pixi
 *
 * @param      {PIXI.DisplayObject}  matteObject  The matte object
 */
const updateTrackMatte = (matteObject) => {
    // If the matte object has a parent, make sure it's updated,
    // so the matte will have a correct transform to render against
    if (matteObject.parent) {
        matteObject.parent.updateTransform();
        // Otherwise, just make sure the transform itself as up-to-date as it can be
    } else {
        matteObject.updateTransform();
    }
};

/**
 * Manages the application of a track matte.
 * @param  {pixijs.DisplayObject}  displayObject        The display object to apply the matte to
 * @param  {pixijs.DisplayObject}  matteObject          The object that renders the matte region
 * @param  {number}                trackMatteType       The numerical representation of the track matte type from bodymovin
 */
export function applyTrackMatte(displayObject, matteObject, trackMatteType) {
    // TODO: add additional functionality for inverted and luma masks
    // switch (trackMatteType) {
    //   case trackMatteTypes.alpha: {
    //     break;
    //   }
    //   case trackMatteTypes.alphaInverted: {
    //     break;
    //   }
    //   case trackMatteTypes.luma: {
    //     break;
    //   }
    //   case trackMatteTypes.lumaInverted: {
    //     break;
    //   }
    //   default: {
    //     break;
    //   }
    // }

    // Save the type of track matte to be used so we can reference it while masking
    displayObject.trackMatteType = trackMatteType;

    // The mask needs to be visible to render
    matteObject.visible = true;
    // Masks can't have masks. If there is a composition mask, it will be applied in `lib/pixi.js/MaskSystem.js`
    matteObject.mask = null;
    // Internal tracker for what the matte is masking. (Not currently used for anything functionally)
    matteObject.matteOf = displayObject;
    displayObject.mask = matteObject;

    const updateTrackMatteHook = updateTrackMatte.bind(null, matteObject);

    matteObject.layerTimeline.registerHookCallback(
        Timeline.hookNames.rendering,
        updateTrackMatteHook,
    );
}