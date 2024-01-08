// Local
import {
    findLayerData
} from '../manifest/index.js';
import BaseChangeOperation from './BaseChangeOperation.js';

/**
 * DISPLAY_OBJECT_VISIBILITY change operation
 *
 * Changes if the layer is shown or hidden
 *
 * @param {object} renderer The renderer the change operation is for
 * @param {object} payload The payload of the change operation
 * @param {string} payload.layer The uuid of the layer to be changed
 * @param {boolean} payload.isVisible If the layer should be made visible or not
 *
 * @memberof ChangeOperations
 * @public
 */
export default class DisplayObjectVisibilityChangeOperation extends BaseChangeOperation {
    constructor(renderer, payload) {
        super(renderer, payload);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
    }

    static get type() {
        return 'DISPLAY_OBJECT_VISIBILITY';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        this.layerData.hd = !this.payload.isVisible;
    };

    updateStage = async () => {
        const layers = this.renderer.filterLayerObjects(this.payload.layer);
        layers.forEach((layer) => {
            // Set the renderable property directly on the layer.
            /* eslint-disable-next-line no-param-reassign */
            layer.renderable = this.payload.isVisible;
        });
    };
}