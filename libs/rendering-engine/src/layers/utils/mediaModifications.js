/* eslint-disable import/prefer-default-export, jsdoc/no-undefined-types */
import _ from 'lodash';
import {
    Graphics,
    Rectangle,
    Sprite,
    utils as PixiUtils
} from 'pixi.js';

import {
    waymarkAssetModificationFits,
    fitFillAlignments
} from '../../manifest/index.js';
import {
    hexStringToColorArray
} from '../../utils/index.js';

/**
 * Get the relative offset to adjust the image based on the image's alignment
 *
 * @param {string} fitFillAlignment The two character value representing the fitFillAlignment
 * @returns {number[]} [verticalModification, horizontalModification] a value between 0 and 1 representing how much to shift the image relatively
 */
const getAlignment = (fitFillAlignment = fitFillAlignments.centerCenter) => {
    let horizontalModification = 0;
    let verticalModification = 0;

    // Top is 0
    // Center
    if (fitFillAlignment[0] === 'C') {
        verticalModification = 0.5;
        // Bottom
    } else if (fitFillAlignment[0] === 'B') {
        verticalModification = 1;
    }

    // Left is 0
    // Center
    if (fitFillAlignment[1] === 'C') {
        horizontalModification = 0.5;
        // Right
    } else if (fitFillAlignment[1] === 'R') {
        horizontalModification = 1;
    }
    return [verticalModification, horizontalModification];
};

export const defaultMediaModifications = {
    fit: waymarkAssetModificationFits.crop,
    fitFillAlignment: fitFillAlignments.centerCenter,
    cropping: {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
    },
    zoom: {
        x: 0.5,
        y: 0.5,
        z: 1.0,
    },
    padding: 0,
}

export const defaultImageMediaModifications = {
    ...defaultMediaModifications,
    fit: waymarkAssetModificationFits.fill,
};

export const defaultVideoMediaModifications = {
    ...defaultMediaModifications,
    fit: waymarkAssetModificationFits.crop,
    hasTimecode: false
};

/**
 * Alters the baseTexture to fit the ultimate Texture frame based on the passed fit style ('fill' or 'crop')
 *
 * @param {PIXI.BaseTexture}  baseTexture  The base texture
 * @param {object} masterAssetSize         The original asset's size
 * @param {number} masterAssetSize.width   The width
 * @param {number} masterAssetSize.height  The height
 * @param {object} displayAssetSize         The original asset's size
 * @param {number} displayAssetSize.width   The width
 * @param {number} displayAssetSize.height  The height
 * @param {object} modifications Possible asset or layer modifications that can affect texture fitting
 * @returns {object} An object containing the frame, orig, trim, and scale properties to use with the texture
 */
export const prepareTextureFit = (
    baseTexture, {
        width: masterAssetWidth,
        height: masterAssetHeight
    }, {
        width: displayWidth,
        height: displayHeight
    },
    modifications = defaultMediaModifications,
) => {
    const {
        fit,
        hasTimecode,
        timecodeSettings
    } = modifications;
    if (hasTimecode && !timecodeSettings) {
        throw new Error(
            'modifications.timecodeSettings required when modifications.hasTimecode is true',
        );
    }

    // Cropping and padding only works on fit = fill and zoom only works on fit = crop
    const {
        cropping,
        padding,
        zoom
    } = modifications;

    // This is the scale that represents the difference between the loaded asset and the master asset
    // This only matters if there is a timecode
    let masterScale = 1;
    let usableWidth = baseTexture.width;
    let usableHeight = baseTexture.height;

    if (hasTimecode) {
        if (baseTexture.width !== masterAssetWidth) {
            masterScale = masterAssetWidth / baseTexture.width;
        }

        // This "usable" size is at the original (unscaled) size (what shows up in the layer)
        // If we have a timecode, we don't want to consider them as part of the size of the texture
        // The timecode is applied at the scale of the master asset
        usableWidth = masterAssetWidth;
        usableHeight =
            masterAssetHeight -
            timecodeSettings.timecodeDigitHeight -
            _.get(timecodeSettings, 'timecodePaddingTop', 0);
    }

    // If the layer has a predefined width/height that doesn't match the generated texture,
    // the base texture is scaled to match. Aspect ratio is preserved, so the scaled texture may
    // have a width xor height greater than the layer width xor height.
    // This mimics imgix's fit=crop behavior: https://docs.imgix.com/apis/url/size/fit#crop
    let scale = 1;
    let widthCropped = usableWidth;
    let heightCropped = usableHeight;
    if (fit === waymarkAssetModificationFits.fill) {
        // If we are using fit=fill, we need to scale the texture so it fits at least one of the two dimensions
        // If we have cropping, we need to remove it from the width/height used by the texture
        // Convert cropping percentage units to pixel crop data
        widthCropped *= cropping.width;
        heightCropped *= cropping.height;
        scale = Math.min(displayWidth / widthCropped, displayHeight / heightCropped);
        // fit === waymarkAssetModificationFits.crop
    } else {
        const displayAspectRatio = displayWidth / displayHeight;
        const assetAspectRatio = usableWidth / usableHeight;
        // The width/height of the frame selected from the texture is scaled according to the zoom.
        // ex a 100px wide image zoomed at 2.0 would select only 50px of the original base texture
        const zoomScale = 1 / zoom.z;
        widthCropped *= zoomScale;
        heightCropped *= zoomScale;
        // If the display texture is wider than the asset, we need to scale the width to be edge to edge
        if (displayAspectRatio > assetAspectRatio) {
            // Because the width is edge to edge, we use the whole baseTexture's width
            // We only want to use the portion of the height that fits inside the display texture, so crop it to the proper aspect ratio
            heightCropped = widthCropped / displayAspectRatio;
            // If the display texture is taller than the asset, we need to scale the height to be edge to edge
        } else if (displayAspectRatio < assetAspectRatio) {
            // Because the height is edge to edge, we use the whole baseTexture's height
            // We only want to use the portion of the width that fits inside the display texture, so crop it to the proper aspect ratio
            widthCropped = heightCropped * displayAspectRatio;
        }

        // Otherwise, use the largest scale option, so we don't wind up with an under-scaled texture
        scale = Math.max(displayWidth / widthCropped, displayHeight / heightCropped);
    }

    // In order to read the timecode accurately, we need to scale the baseTexture up
    if (hasTimecode) {
        // Opting for ceil instead of round or floor so that the asset will scale up slightly on
        // non-even pixels, obscuring the timecodes if there are any
        const scaledWidth = Math.ceil(baseTexture.width * scale * masterScale);
        const scaledHeight = Math.ceil(baseTexture.height * scale * masterScale);
        widthCropped *= scale * masterScale;
        heightCropped *= scale * masterScale;
        usableWidth *= scale * masterScale;
        usableHeight *= scale * masterScale;
        baseTexture.setSize(scaledWidth, scaledHeight);
    }

    // The "Frame" of the texture specifies the region of the base texture that this texture uses.
    // Now that the base texture is scaled, want to scale the size of the frame we want to use with the texture
    // These X/Y/Width/Height values are still done in relation to the original texture size (and can include timecodes)
    let frameX = 0;
    let frameY = 0;
    let frameWidth = widthCropped;
    let frameHeight = heightCropped;
    if (fit === waymarkAssetModificationFits.fill) {
        frameX = usableWidth * cropping.x;
        frameY = usableHeight * cropping.y;
        // The frame can't go outside of the size of the base texture
        frameWidth = Math.min(widthCropped, usableWidth - frameX);
        frameHeight = Math.min(heightCropped, usableHeight - frameY);
    } else {
        frameX = Math.min(Math.max(zoom.x * usableWidth - frameWidth / 2, 0), usableWidth - frameWidth);
        frameY = Math.min(
            Math.max(zoom.y * usableHeight - frameHeight / 2, 0),
            usableHeight - frameHeight,
        );
    }

    const frame = new Rectangle(frameX, frameY, frameWidth, frameHeight);

    // The "orig" is the area of original texture, before it was put in atlas
    const orig = new Rectangle(0, 0, displayWidth, displayHeight);

    // Opting for ceil instead of round or floor so that the asset will scale up slightly on
    // non-even pixels, obscuring the timecodes if there are any
    // Only factor in the scale if we didn't apply it already
    let trimWidth = hasTimecode ? frame.width : Math.ceil(frame.width * scale * masterScale);
    let trimHeight = hasTimecode ? frame.height : Math.ceil(frame.height * scale * masterScale);

    // The Trim is how the frame is positioned inside of the orig/Texture
    const [verticalModification, horizontalModification] = getAlignment(
        modifications.fitFillAlignment,
    );
    const frameAspectRatio = frame.width / frame.height;
    // Because the aspect ratio of the frame is taller that it is wide, we scale the horizontal padding
    if (frameAspectRatio < 1) {
        const trimScale = 1 - (padding * 2) / trimHeight;
        trimWidth *= trimScale;
        trimHeight -= padding * 2;
        // The same, but we scale the vertical padding
    } else if (frameAspectRatio > 1) {
        const trimScale = 1 - (padding * 2) / trimWidth;
        trimWidth -= padding * 2;
        trimHeight *= trimScale;
    } else {
        // Otherwise the scale at the same amount
        trimWidth -= padding * 2;
        trimHeight -= padding * 2;
    }

    // Make sure the dimensions aren't less than zero
    trimWidth = Math.max(trimWidth, 0.001);
    trimHeight = Math.max(trimHeight, 0.001);

    const trim = new Rectangle(
        (displayWidth - padding * 2 - trimWidth) * horizontalModification + padding,
        (displayHeight - padding * 2 - trimHeight) * verticalModification + padding,
        trimWidth,
        trimHeight,
    );

    return {
        frame,
        orig,
        trim,
        scale,
    };
};

/**
 * Applies media modifications on to a layer and its associated texture
 *
 * @param      {PIXI.Container}  mediaLayer     The layer used
 * @param      {object}          modifications  The modifications object
 * @param      {object}          orig           The object representation of the media's size (should be the same one used by the texture)
 */
export const applyMediaLayerModifications = (mediaLayer, modifications, orig) => {
    /* eslint-disable no-param-reassign */
    // This is a cached copy of what modifications were used when setting up this layer
    /* eslint-disable-next-line no-underscore-dangle */
    mediaLayer._mediaLayerModifications = modifications;
    // NOTE: This is not ideal
    // Because images with background fill need to have the fill drawn below the image, we sandwich the fill between two draws of the same texture
    // We can't just use a Container at this time due to our custom modifications to the filter and mask systems to support alpha track mattes, etc
    // So this solution will work fo now until we fully work on a solution with a texture modification shader
    if (mediaLayer.backgroundFill) {
        mediaLayer.backgroundFill.clear();
    } else {
        mediaLayer.backgroundFill = new Graphics();
        mediaLayer.addChild(mediaLayer.backgroundFill);
    }

    if (mediaLayer.mediaRedraw) {
        mediaLayer.mediaRedraw.texture = mediaLayer.texture;
    } else {
        const mediaRedraw = new Sprite(mediaLayer.texture);
        mediaLayer.mediaRedraw = mediaRedraw;
        mediaLayer.addChild(mediaRedraw);
    }

    const color = hexStringToColorArray(modifications.backgroundFill || '#00000000');
    const [, , , alpha] = color;

    // Only make a fill layer if there's an alpha and we're using fit = fill
    if (alpha && modifications.fit === waymarkAssetModificationFits.fill) {
        // convert the array to hex
        mediaLayer.backgroundFill.beginFill(PixiUtils.rgb2hex(color.slice(0, 3)));
        // pull out the alpha of the array
        mediaLayer.backgroundFill.alpha = alpha;
        mediaLayer.backgroundFill.drawRect(orig.x, orig.y, orig.width, orig.height);
        mediaLayer.backgroundFill.endFill();
        mediaLayer.backgroundFill.visible = true;
        mediaLayer.mediaRedraw.visible = true;
    } else {
        // We don't need to render the fill or the redraw if alpha = 0
        mediaLayer.backgroundFill.visible = false;
        mediaLayer.mediaRedraw.visible = false;
    }
    /* eslint-enable no-param-reassign */
};

/* eslint-enable import/prefer-default-export, jsdoc/no-undefined-types */