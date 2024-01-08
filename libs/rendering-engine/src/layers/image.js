/* eslint-disable jsdoc/no-undefined-types */
// Vendor
import {
    Sprite,
    Texture
} from 'pixi.js';

// Local
import {
    applyDisplayObjectProperties,
    defaultImageMediaModifications,
    prepareTextureFit,
    applyMediaLayerModifications,
    setDirty,
    loadAssetForLayer,
} from './utils/index.js';
import {
    getContentPropertiesFromLayerData
} from '../manifest/index.js';

/**
 * @param {object} layerData Layer information about the layer to create from the project manifest
 * @param {object[]} assets Possible assets data from the project manifest
 * @param {Timeline} timeline The layer Timeline that will be used for this layer
 * @param {object} options Additional objects to be used by a change operation
 * @param {PIXI.Sprite} options.object When recreating a layer using a change operation, supplying the object here will re-apply new properties in place
 * @returns {Promise} A proimise that resolves to the a PIXI Sprite layer object
 */
// eslint-disable-next-line import/prefer-default-export
export async function createImageFromLayer(layerData, assets, timeline, options = {}) {
    // Specific layer properties can cause changes to asset urls
    const layerContentProperties = getContentPropertiesFromLayerData(layerData);

    let asset;
    let resource;
    try {
        const assetResponse = await loadAssetForLayer(assets, layerData, layerContentProperties);
        ({
            asset,
            resource
        } = assetResponse);
    } catch (e) {
        console.error('Could not load image', e);
        return new Sprite();
    }

    if (Object.keys(asset.modifications || {}).length) {
        // console.warn(
        //   `Asset (${asset.id}) has a modification object present. Asset modifications are currently not recommended.`,
        // );
    }

    // NOTE: Should we just expect this to fail if a resource doesn't have a texture?
    const {
        baseTexture
    } = resource.texture;

    // Specific layerData modifications take precedence over asset modifications
    const modifications = {
        ...defaultImageMediaModifications,
        ...asset.modifications,
        // TODO: Remove this when change operations are updated
        ...layerData.modifications,
        ...layerContentProperties,
    };

    const {
        frame,
        orig,
        trim
    } = prepareTextureFit(
        baseTexture, {
            width: baseTexture.width,
            height: baseTexture.height
        }, {
            width: asset.w,
            height: asset.h
        },
        modifications,
    );

    const texture = new Texture(baseTexture, frame, orig, trim);

    let sprite;
    const {
        object
    } = options;
    if (object) {
        object.layerTimeline.removeAllTweens();
        sprite = object;
        sprite.texture = texture;
        setDirty(object);
    } else {
        sprite = new Sprite(texture);
    }
    // applyMediaLayerModifications needs to go above applyDisplayObjectProperties so the `mediaRedraw` property is present, allowing blend modes to work correctly
    applyMediaLayerModifications(sprite, modifications, orig);
    applyDisplayObjectProperties(sprite, layerData, timeline, sprite.layerTimeline);

    return sprite;
}
/* eslint-enable jsdoc/no-undefined-types */