// Vendor
import _ from 'lodash';

// Local
import {
    createTextFromLayer,
    waymarkTextCustomProperties
} from '../layers/text/index.js';
import {
    findLayerData
} from '../manifest/index.js';
import BaseChangeOperation from './BaseChangeOperation.js';

/**
 * TEXT_CONTENT change operation
 *
 * @param {object} renderer The renderer the change operation is for
 * @param {object} payload The payload of the change operation
 * @param {string} payload.layer The uuid of the layer to be changed
 * @param {string} payload.text The new text for the layer
 
 * @memberof ChangeOperations
 * @public 
 
 */
export default class TextContentChangeOperation extends BaseChangeOperation {
    constructor(...args) {
        super(...args);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
    }

    static get type() {
        return 'TEXT_CONTENT';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        const textPropertyKeyframes = this.layerData.t.d.k;
        textPropertyKeyframes.forEach((textPropertyKeyframe, index) => {
            if (_.isObject(textPropertyKeyframe)) {
                if (textPropertyKeyframe.s && typeof textPropertyKeyframe.s.t !== 'undefined') {
                    // eslint-disable-next-line no-param-reassign
                    textPropertyKeyframe.s.t = this.payload.text;
                }
            } else {
                textPropertyKeyframes[index] = this.payload.text;
            }
        });
    };

    updateStage = async () => {
        const layers = this.renderer.filterLayerObjects(this.payload.layer);
        await Promise.all(
            layers.map(async (layer) => {
                await createTextFromLayer(
                    this.layerData,
                    this.renderer.videoData.assets,
                    layer.layerTimeline, {
                        object: layer,
                    },
                );

                await layer[waymarkTextCustomProperties.onTextContentChange].call();
            }),
        );
    };
}