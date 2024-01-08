// Vendor
import _ from 'lodash';

// Local
import {
    createWaymarkVideoFromLayer
} from '../layers/waymarkVideo/index.js';
import {
    findLayerData,
    layerTypes,
    updateAssetData
} from '../manifest/index.js';
import BaseChangeOperation from './BaseChangeOperation.js';

/**
 * WAYMARK_VIDEO_ASSET method for updating the frame synced video layer resource.
 *
 * @memberof ChangeOperations
 * @public
 * @deprecated In favor of ChangeOperations.LayerVideoChangeOperation
 */
export default class WaymarkVideoAssetChangeOperation extends BaseChangeOperation {
    constructor(...args) {
        super(...args);

        // Ideally, We want payload.layer to be the primary way of identifying and switching out a video layer
        if (this.payload.layer) {
            this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
            // But we need to support old templates with a video layer that still only operate without the layer in the payload
        } else {
            console.warn(
                'This video asset change operation is deprecated. Please supply a layer UUID in the payload.',
            );
            this.layerData = findLayerData(
                this.renderer.videoData,
                ({
                    ty
                }) => ty === layerTypes.waymarkVideo,
            );
        }
    }

    static get type() {
        return 'WAYMARK_VIDEO_ASSET';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        const newAsset = _.cloneDeep(this.payload.asset);
        if (_.isUndefined(newAsset.id)) {
            newAsset.id = this.layerData.refId;
        }
        this.newAsset = updateAssetData(this.renderer.videoData.assets, newAsset);
        this.layerData.refId = this.newAsset.id;
    };

    getAssetsToLoad = () => [this.newAsset];

    updateStage = async () => {
        const layer = this.renderer.findLayerObject(this.payload.layer);

        const {
            currentTime: seconds
        } = layer.videoMediaHandler.videoElement;

        await createWaymarkVideoFromLayer(
            this.layerData,
            this.renderer.videoData.assets,
            layer.layerTimeline,
            this.renderer.pixiApplication,
            layer.videoMediaHandler.options.framerate,
            this.renderer, {
                object: layer,
            },
        );
        await this.renderer.loadAudioMediaHandlers();
        await layer.videoMediaHandler.seekToTime(seconds);
    };
}