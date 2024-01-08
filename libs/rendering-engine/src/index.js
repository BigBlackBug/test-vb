// Vendor
import * as PixiJS from 'pixi.js';
import BezierJS from 'bezier-js';
import * as PixiFilterDropShadow from '@pixi/filter-drop-shadow';

// Local
import WaymarkAuthorWebRenderer from './WaymarkAuthorWebRenderer.js';
import enableCustomPixiJSProperties from './lib/pixi.js/index.js';
import enablePixiFilterDropShadowProperties from './lib/pixi-filter-drop-shadow/index.js';
import enableBezierJSUtilities from './lib/bezier-js/index.js';
import '@pixi/graphics-extras';

// TODO: Re-add? once moved to the monorepo
// Debugger
// import DebugManager from './debug/index.js';
// WaymarkAuthorWebRenderer.debugger = new DebugManager();
export * from './debug/DisplayObject.js';

// Enable our customizations to Pixi, Greensock, and BezierJS objects.
enableCustomPixiJSProperties(PixiJS);
enableBezierJSUtilities(BezierJS);
enablePixiFilterDropShadowProperties(PixiFilterDropShadow);

// Export custom property utils.
export {
    enableCustomPixiJSProperties,
    enableBezierJSUtilities
};

export {
    ChangeOperations,
    DisplayObjectVisibilityChangeOperation,
    EffectFillColorChangeOperation,
    FontPropertyChangeOperation,
    ImageAssetChangeOperation,
    ImagePathChangeOperation,
    ShapeFillColorChangeOperation,
    ShapeGradientFillColorStepsChangeOperation,
    ShapeStrokeColorChangeOperation,
    SolidFillColorChangeOperation,
    TextContentChangeOperation,
    TextStrokeColorChangeOperation,
    TextFillColorChangeOperation,
    WaymarkAudioAssetChangeOperation,
    WaymarkVideoAssetChangeOperation,
    LayerAudioChangeOperation,
    LayerImageChangeOperation,
    LayerVideoChangeOperation,
}
from './changeOperations/index.js';
export * from './layers/index.js';
export * from './manifest/index.js';
export * from './utils/index.js';
// TODO: Re-add? once moved to the monorepo
// export * from './debug/index.js';
export * from './timeline/index.js';
export {
    defaults as defaultSettings,
    // exported in './manifest/index.js';
    // assetQuality,
    effects,
    effectQuality,
    textureQuality,
    timeSyncVideoSeekMode,
}
from './settings.js';

// Re-add? once moved to the monorepo
// export { RendererControls, RendererPlayer, RendererCanvas } from './player/index.js';

export default WaymarkAuthorWebRenderer;

export {
    createOutlineObject_TEMP,
    removeOutlineObject_TEMP,
    updateObjectOutline_TEMP,
}
from './WaymarkAuthorWebRenderer.js';