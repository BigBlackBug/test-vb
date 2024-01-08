import _ from 'lodash';
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
 * Gets the midpoint color array between a starting and ending color array
 *
 * @param      {number[]}  startingColorArray  The starting color array
 * @param      {number[]}  endingColorArray    The ending color array
 * @param      {number}  midpointPosition    The midpoint position
 * @returns     {Array}   The midpoint color array.
 */
function getMidpointColorArray(startingColorArray, endingColorArray, midpointPosition) {
    const [startingPosition, startingRed, startingGreen, startingBlue] = startingColorArray;
    const [endingPosition, endingRed, endingGreen, endingBlue] = endingColorArray;

    const totalDistance = endingPosition - startingPosition;
    const relativePosition = (midpointPosition - startingPosition) / totalDistance;

    return [
        midpointPosition,
        (endingRed - startingRed) * relativePosition + startingRed,
        (endingGreen - startingGreen) * relativePosition + startingGreen,
        (endingBlue - startingBlue) * relativePosition + startingBlue,
    ];
}

/**
 * Update a manifest shapes array for a color array.
 *
 * @param {object[]} shapes The shapes to update
 * @param {number[]} colorArray An array [r,g,b] of the fill color
 * @param {number} stepIndex What gradient step to update
 */
function updateShapeGradientFillColorSteps(shapes, colorArray, stepIndex) {
    shapes.forEach((shape) => {
        switch (shape.ty) {
            case 'gr':
                {
                    updateShapeGradientFillColorSteps(shape.it, colorArray, stepIndex);
                    break;
                }
            case 'gf':
                {
                    const totalGradientStepsCount = shape.g.p;
                    const gradientSteps = shape.g.k.k;

                    // Chunk the stops so they're easier to work with
                    const colorStopsArray = _.chunk(gradientSteps.slice(0, totalGradientStepsCount * 4), 4);

                    // Alter the stop we want to change directly
                    // Bodymovin exports the color steps with midpoints counting as independent
                    // color steps. For the sake of our authors, we won't consider the mipoints, but
                    // instead alter the midpoint steps programatically.
                    const trueStepIndex = stepIndex * 2;
                    const stopColor = colorStopsArray[trueStepIndex];
                    stopColor.splice(1, 3, ...colorArray);

                    // If this is not the first step, alter the previous midpoiunt
                    if (trueStepIndex > 1) {
                        colorStopsArray[trueStepIndex - 1] = getMidpointColorArray(
                            colorStopsArray[trueStepIndex - 2],
                            stopColor,
                            colorStopsArray[trueStepIndex - 1][0],
                        );
                    }
                    // If this is not the last step, alter the next midpoiunt
                    if (trueStepIndex < colorStopsArray.length - 2) {
                        colorStopsArray[trueStepIndex + 1] = getMidpointColorArray(
                            stopColor,
                            colorStopsArray[trueStepIndex + 2],
                            colorStopsArray[trueStepIndex + 1][0],
                        );
                    }

                    // eslint-disable-next-line no-param-reassign
                    shape.g.k.k = _.flatten(colorStopsArray);
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
 * SHAPE_GRADIENT_FILL_COLOR_STEPS change operation
 *
 * @memberof ChangeOperations
 * @public
 */
export default class ShapeGradientFillColorStepsChangeOperation extends BaseChangeOperation {
    constructor(...args) {
        super(...args);
        this.layerData = findLayerData(this.renderer.videoData, this.payload.layer);
    }

    static get type() {
        return 'SHAPE_GRADIENT_FILL_COLOR_STEPS';
    }
    static get isLayerModification() {
        return true;
    }

    updateManifest = async () => {
        const colorArray = hexToColorArray(this.payload.color);
        updateShapeGradientFillColorSteps(this.layerData.shapes, colorArray, this.payload.stepIndex);
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