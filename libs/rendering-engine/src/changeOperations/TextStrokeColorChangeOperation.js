// Vendor
import _ from 'lodash';

// Local
import {
    createTextFromLayer
} from '../layers/text/index.js';
import {
    hexToColorArray
} from '../utils/index.js';
import {
    findLayerData
} from '../manifest/index.js';
import BaseChangeOperation from './BaseChangeOperation.js';

/**
 * TEXT_STROKE_COLOR change
 *
 * @param {object} renderer The renderer the change operation is for
 * @param {object} payload The payload of the change operation
 * @param {string} payload.layer The uuid of the layer to be changed
 * @param {boolean} payload.color The Fill color (as a hex string)
 * @param {boolean} [payload.isImportant=false] Will mark the change as important. It only can be changed again if `isImportant` is true.
 *
 * @memberof ChangeOperations
 * @public
 */
export default class TextStrokeColorChangeOperation extends BaseChangeOperation {
    constructor(...args) {
        super(...args);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
    }

    static get type() {
        return 'TEXT_STROKE_COLOR';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        const importantChanges = this.layerData.meta.__importantChanges || [];

        if (this.payload.isImportant && !importantChanges.includes('TEXT_FILL_COLOR.color')) {
            importantChanges.push('TEXT_FILL_COLOR.color');
            this.layerData.meta.__importantChanges = importantChanges;
        }

        if (this.payload.isImportant || !importantChanges.includes('TEXT_FILL_COLOR.color')) {
            const colorArray = hexToColorArray(this.payload.color);

            const textPropertyKeyframes = this.layerData.t.d.k;
            textPropertyKeyframes.forEach((textPropertyKeyframe) => {
                if (
                    _.isObject(textPropertyKeyframe) &&
                    textPropertyKeyframe.s &&
                    typeof textPropertyKeyframe.s.sc !== 'undefined'
                ) {
                    // eslint-disable-next-line no-param-reassign
                    textPropertyKeyframe.s.sc = colorArray;
                }
            });
        }
    };

    updateStage = async () => {
        const layers = this.renderer.filterLayerObjects(this.payload.layer);
        await Promise.all(
            layers.map((layer) =>
                createTextFromLayer(this.layerData, this.renderer.videoData.assets, layer.layerTimeline, {
                    object: layer,
                }),
            ),
        );
    };
}