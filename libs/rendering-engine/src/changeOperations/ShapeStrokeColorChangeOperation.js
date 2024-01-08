// Local
import {
    createShapeFromLayer
} from '../layers/index.js';
import {
    hexToColorArray
} from '../utils/index.js';
import {
    findLayerData
} from '../manifest/index.js';
import BaseChangeOperation from './BaseChangeOperation.js';

/**
 * Update a manifest shapes array for a color array.
 *
 * @param {object[]} shapes The shapes to update
 * @param {number[]} colorArray An array [r,g,b] of the fill color
 */
function updateShapesStrokeColor(shapes, colorArray) {
    shapes.forEach((shape) => {
        switch (shape.ty) {
            case 'gr':
                {
                    updateShapesStrokeColor(shape.it, colorArray);
                    break;
                }
            case 'st':
                {
                    const colorValue = shape.c.k;
                    [colorValue[0], colorValue[1], colorValue[2]] = colorArray;
                    break;
                }
            default:
                {
                    break;
                }
        }
    });
}

/**
 * SHAPE_STROKE_COLOR change operation
 *
 * @param {object} renderer The renderer the change operation is for
 * @param {object} payload The payload of the change operation
 * @param {string} payload.layer The uuid of the layer to be changed
 * @param {boolean} payload.color The Fill color (as a hex string)
 *
 * @memberof ChangeOperations
 * @public
 */
export default class ShapeStrokeColorChangeOperation extends BaseChangeOperation {
    constructor(...args) {
        super(...args);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
    }

    static get type() {
        return 'SHAPE_STROKE_COLOR';
    }

    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        const colorArray = hexToColorArray(this.payload.color);
        updateShapesStrokeColor(this.layerData.shapes, colorArray);
    };

    updateStage = async () => {
        const layers = this.renderer.filterLayerObjects(this.payload.layer);
        layers.forEach((layer) => {
            createShapeFromLayer(this.layerData, layer.layerTimeline, {
                object: layer
            });
        });
    };
}