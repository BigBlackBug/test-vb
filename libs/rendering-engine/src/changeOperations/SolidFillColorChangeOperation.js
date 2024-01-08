import {
    utils
} from 'pixi.js';

// Local
import {
    createSolidFromLayer
} from '../layers/index.js';
import {
    findLayerData
} from '../manifest/index.js';
import BaseChangeOperation from './BaseChangeOperation.js';

/**
 * SOLID_FILL_COLOR change operation
 *
 * @param {object} renderer The renderer the change operation is for
 * @param {object} payload The payload of the change operation
 * @param {string} payload.layer The uuid of the layer to be changed
 * @param {boolean} payload.color The Fill color (as a hex string)
 *
 * @memberof ChangeOperations
 * @public
 */
export default class SolidFillColorChangeOperation extends BaseChangeOperation {
    constructor(...args) {
        super(...args);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
    }

    static get type() {
        return 'SOLID_FILL_COLOR';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        this.layerData.sc = utils.hex2string(this.payload.color);
    };

    updateStage = async () => {
        const layers = this.renderer.filterLayerObjects(this.payload.layer);
        layers.forEach((layer) => {
            createSolidFromLayer(this.layerData, layer.layerTimeline, {
                object: layer
            });
        });
    };
}