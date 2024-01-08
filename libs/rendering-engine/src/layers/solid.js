// Vendor
import {
    Graphics
} from 'pixi.js';

// Local
import {
    rbgStringToNumber
} from '../utils/index.js';
import {
    applyDisplayObjectProperties,
    setDirty
} from './utils/index.js';

// eslint-disable-next-line import/prefer-default-export
export function createSolidFromLayer(layerData, timeline, options = {}) {
    const {
        object
    } = options;
    if (object) {
        setDirty(object);
        timeline.removeAllTweens();
    }

    const solid = object || new Graphics();

    // Clear the previous draw state of the solid
    solid.clear();
    solid.beginFill(rbgStringToNumber(layerData.sc, 'number') || 0x000000);
    solid.drawRect(0, 0, layerData.sw, layerData.sh);
    solid.endFill();

    applyDisplayObjectProperties(solid, layerData, timeline);

    return solid;
}