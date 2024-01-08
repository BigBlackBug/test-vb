// Local
import BaseChangeOperation from './BaseChangeOperation.js';
import {
    createImageFromLayer
} from '../layers/index.js';
import {
    findLayerData
} from '../manifest/index.js';
import {
    uuid
} from '../utils/index.js';
import {
    updateLayerContentProperty,
    updateTextureLayerProperties
} from './utils.js';

/**
 *  The LAYER_IMAGE change operation for altering properties on an image layer
 *
 * Example payload:
 * ```
 * {
 *   layer: '[UUID]',
 *   content: {type, key, location},
 *   contentPlaybackDuration: 250,
 *   contentBackgroundFill: "#FFCCAA",
 *   contentCropping: {
 *      x: .15,
 *      y: .25,
 *      width: .8,
 *      height: .5
 *   },
 *   contentPadding: 20,
 *   contentFit: 'fill',
 *   contentZoom: {
 *      x: .5,
 *      y: .5,
 *      z: 2.0
 *   },
 *   contentFitFillAlignment: 'CC',
 * }
 * ```
 *
 * @param {object} renderer The renderer the change operation is for
 * @param {object} payload The payload of the change operation
 * @param {string} payload.layer The uuid of the layer to be changed
 * @param {object} payload.content The reference to the asset used for this layer ex: `{type, key, location}`
 * @param {string} payload.contentBackgroundFill The content's background fill color
 * @param {object} payload.contentCropping The content's cropping object
 * @param {number} payload.contentCropping.x The cropping x position
 * @param {number} payload.contentCropping.y The cropping y position
 * @param {number} payload.contentCropping.width The cropping width
 * @param {number} payload.contentCropping.height The cropping height
 * @param {number} payload.contentPadding The content's padding value
 * @param {string} payload.contentFit The content's fit type
 * @param {object} payload.contentZoom The content's zoom object
 * @param {number} payload.contentZoom.x The content's zoom focus point on the texture. A unitless number representing the proportion of the width (0.0 -> 1.0)
 * @param {number} payload.contentZoom.y The content's zoom focus point on the texture. A unitless number representing the proportion of the hight (0.0 -> 1.0)
 * @param {number} payload.contentZoom.z The content's zoom. A number repressenting to amount to zoom in (ex: 1.0 is no zoom, 2.0 is 2x zoom)
 * @param {string} payload.contentFitFillAlignment The texture alignment (Defaults to Center, Center) ex `CC`
 * @memberof ChangeOperations
 * @public
 */
export default class LayerImageChangeOperation extends BaseChangeOperation {
    constructor(renderer, payload) {
        super(renderer, payload);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
    }

    static get type() {
        return 'LAYER_IMAGE';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        if (this.payload.content) {
            if (!this.payload.w || !this.payload.h) {
                // Get the height and width from the existing asset
                const existingAsset = this.renderer.videoData.assets.find(
                    ({
                        id
                    }) => id === this.layerData.refId,
                );
                this.payload.content.w = existingAsset.w;
                this.payload.content.h = existingAsset.h;
                // console.warn(
                //   `Payload for layer (${this.payload.layer}) did not specify dimensions for the content, this is not advised`,
                // );
            }

            this.payload.content.id = `layer_image_change_operation_${uuid()}`;
        }

        this.newAsset = updateLayerContentProperty(
            this.layerData,
            this.renderer.videoData.assets,
            this.payload,
        );
        updateTextureLayerProperties(this.layerData, this.payload);
    };

    getAssetsToLoad = () => {
        if (this.newAsset) {
            return [this.newAsset];
        }
        return [];
    };

    updateStage = async () => {
        const layers = this.renderer.filterLayerObjects(this.payload.layer);

        const creatingImages = layers.map((layer) =>
            createImageFromLayer(this.layerData, this.renderer.videoData.assets, layer.layerTimeline, {
                object: layer,
            }),
        );

        return Promise.all(creatingImages);
    };
}