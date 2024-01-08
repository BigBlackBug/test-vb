// Local
import {
    createImageFromLayer
} from '../layers/image.js';
import {
    findLayerData,
    updateAssetData
} from '../manifest/index.js';
import BaseChangeOperation from './BaseChangeOperation.js';

/**
 * IMAGE_PATH change operation
 *
 * @memberof ChangeOperations
 * @public
 * @deprecated In favor of ChangeOperations.LayerImageChangeOperation
 */
export default class ImagePathChangeOperation extends BaseChangeOperation {
    constructor(renderer, payload) {
        super(renderer, payload);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
    }

    static get type() {
        return 'IMAGE_PATH';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        this.newAsset = updateAssetData(this.renderer.videoData.assets, {
            p: this.payload.path,
            id: this.layerData.refId,
        });
    };

    getAssetsToLoad = () => [this.newAsset];

    updateStage = async () => {
        const layers = this.renderer.filterLayerObjects(this.payload.layer);

        for (let i = 0; i < layers.length; i += 1) {
            const layer = layers[i];
            /* eslint-disable-next-line no-await-in-loop */
            await createImageFromLayer(
                this.layerData,
                this.renderer.videoData.assets,
                layer.layerTimeline, {
                    object: layer
                },
            );
        }
    };
}