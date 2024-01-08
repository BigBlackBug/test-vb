import _ from 'lodash';

// Local
import BaseChangeOperation from './BaseChangeOperation.js';
import {
    updateTextureLayerProperties
} from './utils.js';
import {
    createImageFromLayer
} from '../layers/index.js';
import {
    findLayerData,
    updateAssetData
} from '../manifest/index.js';
import {
    uuid
} from '../utils/index.js';

/**
 * IMAGE_ASSET method for updating a Waymark audio asset.
 * The expected asset should be in the videoData assetData format (renderer.videoData.assets)
 *
 * @memberof ChangeOperations
 * @public
 * @deprecated In favor of ChangeOperations.LayerImageChangeOperation
 */
export default class ImageAssetChangeOperation extends BaseChangeOperation {
    constructor(renderer, payload) {
        super(renderer, payload);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
        console.warn(
            'This image asset change operation is deprecated. Please use LAYER_IMAGE instead.',
        );
    }

    static get type() {
        return 'IMAGE_ASSET';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        // We _do not_ like the way this is done currently. It needs to deduce the width and height from the
        // existing project manifest asset (which it finds by refid), but it also has to generate a new
        // asset id because if it uses the same one, multiple layers pointing to that asset id will update,
        // to complicate things further, sometimes API consumers pass in `w` and `h` into the API mistakenly
        // so we have to strip those. This isn't ideal. We should lock down the API and try to find a way to not
        // generate a new uid everytime.
        const payloadAsset = _.omit(_.cloneDeep(this.payload.asset), 'w', 'h');

        const foundAsset = this.renderer.videoData.assets.find(({
            id
        }) => id === this.layerData.refId);

        const newAsset = {
            ...foundAsset,
            ...payloadAsset,
            id: `image_changeOperation_${uuid()}`,
        };

        this.newAsset = updateAssetData(this.renderer.videoData.assets, newAsset, true);
        updateTextureLayerProperties(this.layerData, this.payload);
        this.layerData.refId = this.newAsset.id;
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