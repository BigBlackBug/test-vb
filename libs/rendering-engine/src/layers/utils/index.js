/* eslint-disable no-param-reassign */

// Vendor
import {
    Extract,
    Rectangle,
    RenderTexture
} from 'pixi.js';

// Local
import {
    textureQuality
} from '../../settings.js';

export {
    addAsset,
    loadQueuedAssets,
    loadAllAssets,
    loadAsset,
    loadAssetForLayer,
    loadUrl,
}
from './assets.js';

export {
    getObjectsUnderInteraction
}
from './interaction.js';

export {
    applyBlendModeToContainer,
    applyProperty,
    applyVisibilityBoundsToObject,
    applyAlphaToObject,
    applyTransformsToObject,
    applyBlendMode,
    applyDisplayObjectProperties,
    filterTweensOfProperties,
    applyLayerAudioProperties,
    applyTimeRemapProperties,
}
from './properties.js';

export * from './mediaModifications.js';

/**
 * Set a layer as dirty.
 * This flags a layer as changed, so PixiJS knows to update the canvas on the next render operation.
 * This should always be called when a layer is edited directly.
 *
 * @param {object}  layer  PixiJS Layer
 */
export function setDirty(layer) {
    /* eslint-disable no-param-reassign */
    if ('dirty' in layer) {
        layer.dirty = typeof layer.dirty === 'boolean' ? true : layer.dirty + 1;
    }

    if ('clearDirty' in layer) {
        layer.clearDirty = typeof layer.clearDirty === 'boolean' ? true : layer.clearDirty + 1;
    }
    /* eslint-enable no-param-reassign */
}

export const TEXTURE_QUALITY_TO_SIZE = {
    [textureQuality.high]: Infinity,
    [textureQuality.medium]: 1920,
    [textureQuality.low]: 1080,
};