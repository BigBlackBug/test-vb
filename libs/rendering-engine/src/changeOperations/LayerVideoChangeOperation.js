// Local
/* eslint-disable jsdoc/no-undefined-types */
import BaseChangeOperation from './BaseChangeOperation.js';
import {
    createWaymarkVideoFromLayer
} from '../layers/index.js';
import {
    findLayerData
} from '../manifest/index.js';
import {
    updateLayerContentProperty,
    updateMediaLayerProperties,
    updateTextureLayerProperties,
    updateLayerContentTimeProperties,
} from './utils.js';

/**
 * The LAYER_VIDEO change operation for altering properties on a video layer
 *
 * Example payload:
 * ```
 * {
 *   layer: '[UUID]',
 *   isMuted: true,
 *   volume: .8,
 *   content: {type, key, location},
 *   contentTrimStartTime: 3.33,
 *   contentTrimDuration: 10.5,
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
 *   volumeChanges: [{
 *       type: 'targetDucking'
 *       duckingLayer: '[UUID]',
 *       targetVolume: .3
 *   }]
 *  }
 * ```
 *
 * @param {object} renderer The renderer the change operation is for
 * @param {object} payload The payload of the change operation
 * @param {string} payload.layer The uuid of the layer to be changed
 * @param {number} payload.volume The overall (Master) volume for an audio layer from 0 -> 1.0
 * @param {boolean} payload.isMuted If the audio overall is muted
 * @param {object} payload.content The reference to the asset used for this layer ex: `{type, key, location}`
 * @param {duckingVolumeChange[]} payload.volumeChanges An array of changes to the volume (used for ducking, fade outs, etc)
 * @param {number} payload.contentTrimStartTime The frame the video should start at (in its own asset time) ex: `3.33`
 * @param {number} payload.contentTrimDuration The duration of the video (in its own asset time) ex: `10.5`
 * @param {number} payload.contentPlaybackDuration Changes the playback rate of the video inside the layer (how long in the layer timeline it should take). Ex: `250` Longer times than duration will slow the playback rate, shorter times will speed up the playback rate.
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
 *
 * @memberof ChangeOperations
 * @public
 */
export default class LayerVideoChangeOperation extends BaseChangeOperation {
    constructor(renderer, payload) {
        super(renderer, payload);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
    }

    static get type() {
        return 'LAYER_VIDEO';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        this.newAsset = updateLayerContentProperty(
            this.layerData,
            this.renderer.videoData.assets,
            this.payload,
        );
        updateTextureLayerProperties(this.layerData, this.payload);
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
        const layer = this.renderer.findLayerObject(this.payload.layer);

        await createWaymarkVideoFromLayer(
            this.layerData,
            this.renderer.videoData.assets,
            layer.layerTimeline,
            this.renderer.pixiApplication,
            // This ideally would be be the framerate of the video itself, but that's for future work
            // eslint-disable-next-line no-underscore-dangle
            this.renderer._framerate,
            this.renderer, {
                object: layer,
            },
        );

        await this.renderer.loadAudioMediaHandlers();
    };
}
/* eslint-enable jsdoc/no-undefined-types */