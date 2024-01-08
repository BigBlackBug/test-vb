// Vendor
import {
    Graphics
} from 'pixi.js';

// Local
import {
    applyDisplayObjectProperties
} from './utils/index.js';

// eslint-disable-next-line import/prefer-default-export
export function createNullFromLayer(layerData, timeline) {
    const nullObject = new Graphics();
    nullObject.beginFill('0xFFFFFF');
    // Null layers actually have a height and width of 100 in After Effects
    nullObject.drawRect(0, 0, 100, 100);
    nullObject.endFill();
    nullObject.renderable = false;
    applyDisplayObjectProperties(nullObject, layerData, timeline);
    return nullObject;
}