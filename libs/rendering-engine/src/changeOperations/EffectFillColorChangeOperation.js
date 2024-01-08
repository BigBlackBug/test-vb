// Local
import {
    hexToColorArray
} from '../utils/index.js';
import {
    applyEffectToObject
} from '../layers/effects/index.js';
import {
    findLayerData
} from '../manifest/index.js';
import BaseChangeOperation from './BaseChangeOperation.js';

/**
 * EFFECT_FILL_COLOR change operation
 *
 * @memberof ChangeOperations
 *
 * Changing the color of a effect, a color overlay on a layer.
 *
 * @param {object} renderer The renderer the change operation is for
 * @param {object} payload The payload of the change operation
 * @param {string} payload.layer The uuid of the layer to be changed
 * @param {boolean} payload.color The Fill color (as a hex string)
 *
 * @memberof ChangeOperations
 * @public
 */
export default class EffectFillColorChangeOperation extends BaseChangeOperation {
    constructor(renderer, payload) {
        super(renderer, payload);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
    }

    static get type() {
        return 'EFFECT_FILL_COLOR';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        const importantChanges = this.layerData.meta.__importantChanges || [];

        if (this.payload.isImportant && !importantChanges.includes('EFFECT_FILL_COLOR.color')) {
            importantChanges.push('EFFECT_FILL_COLOR.color');
            this.layerData.meta.__importantChanges = importantChanges;
        }

        if (this.payload.isImportant || !importantChanges.includes('EFFECT_FILL_COLOR.color')) {
            const colorArray = hexToColorArray(this.payload.color);

            // Modify effects property
            this.layerData.ef.forEach((effect) => {
                if (effect.ty === 21) {
                    effect.ef.forEach((prop) => {
                        if (prop.nm === 'Color') {
                            const colorValue = prop.v.a ? prop.v.k[0].s : prop.v.k;
                            [colorValue[0], colorValue[1], colorValue[2]] = colorArray;
                        }
                    });
                }
            });
        }
    };

    updateStage = async () => {
        const layers = this.renderer.filterLayerObjects(this.payload.layer);
        layers.forEach((layer) => {
            this.layerData.ef.forEach((effect) => {
                applyEffectToObject(layer, effect, layer.layerTimeline);
            });
        });
    };
}