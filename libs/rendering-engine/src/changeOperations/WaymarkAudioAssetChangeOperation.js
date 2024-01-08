// Vendor
import _ from 'lodash';

// Local
import BaseChangeOperation from './BaseChangeOperation.js';
import {
    createWaymarkAudioFromLayer
} from '../layers/index.js';
import {
    uuid
} from '../utils/index.js';
import {
    findLayerData,
    updateAssetData,
    layerTypes
} from '../manifest/index.js';

/**
 * WAYMARK_AUDIO_ASSET method for updating a Waymark audio asset.
 * The expected asset should be in the videoData assetData format (renderer.videoData.assets)
 * rather than the parsed asset format (renderer.assets);
 *
 * An 'asset' value of `null` will cause no audio to be played.
 *
 * @memberof ChangeOperations
 * @public
 * @deprecated In favor of ChangeOperations.LayerAudioChangeOperation
 */
export default class WaymarkAudioAssetChangeOperation extends BaseChangeOperation {
    constructor(...args) {
        super(...args);
        this.layerData = findLayerData(
            this.renderer.videoData,
            ({
                ty
            }) => ty === layerTypes.waymarkAudio,
        );
    }

    static get type() {
        return 'WAYMARK_AUDIO_ASSET';
    }

    static get isLayerModification() {
        return false;
    }

    updateManifest = async () => {
        if (this.payload.asset === null) {
            this.layerData.refId = null;
            this.newAsset = null;
            return;
        }

        const newAsset = _.cloneDeep(this.payload.asset);
        if (_.isUndefined(newAsset.id)) {
            // Sometimes we will have a waymark audio layer without a refId
            if (!this.layerData.refId) {
                this.layerData.refId = `audio_${uuid()}`;
            }

            newAsset.id = this.layerData.refId;
        }
        this.newAsset = updateAssetData(this.renderer.videoData.assets, newAsset, true);
        this.layerData.refId = this.newAsset.id;
    };

    getAssetsToLoad = () => (this.newAsset ? [this.newAsset] : []);

    updateStage = async () => {
        const layer = this.renderer.findLayerObject(this.payload.layer);

        const {
            audioMediaHandler
        } = await createWaymarkAudioFromLayer(
            this.layerData,
            this.renderer.videoData.assets,
            layer.layerTimeline,
            // TODO: This ideally would be be the framerate of the composition
            // eslint-disable-next-line no-underscore-dangle
            this.renderer._framerate,
            this.renderer, {
                object: layer,
            },
        );

        await this.renderer.loadAudioMediaHandlers();

        if (this.renderer.isMuted) {
            audioMediaHandler.mute();
        }

        const position = this.renderer.rootTimeline.currentTime;
        audioMediaHandler.seekToFrame(position);
    };
}