/* eslint-disable jsdoc/no-undefined-types */
import _ from 'lodash';
// Local
import BaseChangeOperation from './BaseChangeOperation.js';
import {
    createWaymarkAudioFromLayer
} from '../layers/index.js';
import {
    createLayerData,
    deleteLayerData,
    findLayerData,
    layerTypes
} from '../manifest/index.js';
import {
    Timeline
} from '../timeline/index.js';

import {
    updateLayerContentProperty,
    updateMediaLayerProperties,
    updateLayerContentTimeProperties,
} from './utils.js';

/**
 * The LAYER_AUDIO change operation for altering properties on an audio layer
 *
 * Example payload
 * ```
 * {
 *   layer: '[UUID]|#[myIDName]',
 *   isMuted: true,
 *   volume: .8,
 *   content: {type, key, location},
 *   contentTrimStartTime: 3.33,
 *   contentTrimDuration: 10.5,
 *   contentPlaybackDuration: 250
 *   volumeChanges: [{
 *       type: 'targetDucking'
 *       duckingLayer: '[UUID]',
 *       targetVolume: .3
 *   }]
 *   options: {
 *     shouldAdd: true
 *     shouldDelete: false
 *   }
 *  }
 * ```
 *
 * @param {object} renderer The renderer the change operation is for
 * @param {object} payload The payload of the change operation
 * @param {string} payload.layer The uuid of the layer to be changed
 * @param {boolean} payload.isMuted If the audio overall is muted
 * @param {number} payload.volume The overall (Master) volume for an audio layer from 0 -> 1.0
 * @param {object} payload.content The reference to the asset used for this layer ex: `{type, key, location}`
 * @param {duckingVolumeChange[]} payload.volumeChanges An array of changes to the volume (used for ducking, fade outs, etc)
 * @param {object} options Additional options for the change operations
 * @param {boolean} options.shouldAdd If the a layer should be added instead of updating a layer with the given uuid/id
 * @param {boolean} options.shouldDelete If the a layer should be deleted instead of updating a layer with the given uuid/id
 *
 * @memberof ChangeOperations
 * @public
 */
export default class LayerAudioChangeOperation extends BaseChangeOperation {
    constructor(renderer, payload) {
        super(renderer, payload);

        this.isCreatingLayer = _.get(this.payload, 'options.shouldAdd', false);
        this.isDeletingLayer = _.get(this.payload, 'options.shouldDelete', false);

        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);

        // TODO: We should be throwing errors if `this.isCreatingLayer` is true and
        // we found a layer, or `this.isDeletingLayer` is false and we didn't.
        // WaymarkAuthorWebRenderer._applyChangeList currently creates a change
        // operation when updating the manifest, and then again if it is supposed
        // to update the stage. The `shouldAdd` and `shouldDelete` flags are not
        // updated between the calls, so we have to temporarily allow for both
        // situations and only throw an error if `layerData` is undefined and we
        // were not expecting it to be.
        if (this.isCreatingLayer && !this.layerData) {
            // Right now we are only supporting ids for created layers
            this.layerData = createLayerData(this.renderer.videoData, layerTypes.waymarkAudio, {
                // Layers that need to be searched by ID (dynamic layers) are provided in the
                // payload with a `#` prepending the layer name. We don't actually want the
                // layer ID to have a `#` prepended, so we'll remove it before layer creation.
                meta: {
                    id: this.payload.layer.slice(1)
                },
            });
        } else if (this.isDeletingLayer && this.layerData) {
            deleteLayerData(this.renderer.videoData, this.payload.layer);
        } else if (!this.layerData && !this.isDeletingLayer) {
            throw new Error(`Layer ${this.payload.layer} does not exist`);
        }
    }

    static get type() {
        return 'LAYER_AUDIO';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        if (this.isDeletingLayer) {
            return;
        }

        // TODO: Update layer in and out point if we want an audio layer to start/stop at a different time (other than full template length)
        this.newAsset = updateLayerContentProperty(
            this.layerData,
            this.renderer.videoData.assets,
            this.payload,
        );
        updateMediaLayerProperties(this.layerData, this.renderer.videoData, this.payload);
        updateLayerContentTimeProperties(this.layerData, this.payload, this.renderer.videoData.fr);
    };

    getAssetsToLoad = () => {
        if (this.newAsset) {
            return [this.newAsset];
        }
        return [];
    };

    updateStage = async () => {
        let layer;
        let layerTimeline;
        if (this.isCreatingLayer) {
            layerTimeline = new Timeline();
            this.renderer.rootTimeline.addTimeline(layerTimeline, 0);
        } else {
            layer = this.renderer.findLayerObject(this.payload.layer);
            ({
                layerTimeline
            } = layer);
        }

        if (this.isDeletingLayer) {
            layerTimeline.destroy();
            layer.destroy();
            if (layer.audioMediaHandler) {
                layer.audioMediaHandler.destroy();
            }
            return;
        }

        // If we are dealing with an auxiliary audio layer, the layer is provided in the
        // payload as `#{layerName}`. We don't actually want the layer ID to have `#` prepended,
        // so remove it before layer creation. If the payload layer was a function, we're dealing
        // with the main background audio layer and that layer needs to be searched by either the
        // `nm` or `name` attribute, so we don't need a valid waymarkId.
        const waymarkId = typeof this.payload.layer === 'function' ? null : this.payload.layer.slice(1);

        layer = await createWaymarkAudioFromLayer({
                ...this.layerData,
                waymarkId,
            },
            this.renderer.videoData.assets,
            layerTimeline,
            // TODO: This ideally would be be the framerate of the composition
            // eslint-disable-next-line no-underscore-dangle
            this.renderer._framerate,
            this.renderer, {
                object: layer,
            },
        );

        if (this.isCreatingLayer) {
            this.renderer.pixiApplication.stage.addChild(layer);
            layerTimeline.target = layer;
        }

        await this.renderer.loadAudioMediaHandlers();
    };
}
/* eslint-enable jsdoc/no-undefined-types */