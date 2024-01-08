// Local
import DisplayObjectVisibilityChangeOperation from './DisplayObjectVisibilityChangeOperation.js';
import ImageAssetChangeOperation from './ImageAssetChangeOperation.js';
import ImagePathChangeOperation from './ImagePathChangeOperation.js';
import TextContentChangeOperation from './TextContentChangeOperation.js';
import FontPropertyChangeOperation from './FontPropertyChangeOperation.js';
import TextStrokeColorChangeOperation from './TextStrokeColorChangeOperation.js';
import TextFillColorChangeOperation from './TextFillColorChangeOperation.js';
import SolidFillColorChangeOperation from './SolidFillColorChangeOperation.js';
import ShapeGradientFillColorStepsChangeOperation from './ShapeGradientFillColorStepsChangeOperation.js';
import EffectFillColorChangeOperation from './EffectFillColorChangeOperation.js';
import ShapeFillColorChangeOperation from './ShapeFillColorChangeOperation.js';
import ShapeStrokeColorChangeOperation from './ShapeStrokeColorChangeOperation.js';
import WaymarkVideoAssetChangeOperation from './WaymarkVideoAssetChangeOperation.js';
import WaymarkAudioAssetChangeOperation from './WaymarkAudioAssetChangeOperation.js';
import LayerAudioChangeOperation from './LayerAudioChangeOperation.js';
import LayerImageChangeOperation from './LayerImageChangeOperation.js';
import LayerVideoChangeOperation from './LayerVideoChangeOperation.js';

/**
 * The possible options for change operations
 *
 * @public
 */
const ChangeOperations = {
    [DisplayObjectVisibilityChangeOperation.type]: DisplayObjectVisibilityChangeOperation,
    [TextContentChangeOperation.type]: TextContentChangeOperation,
    [FontPropertyChangeOperation.type]: FontPropertyChangeOperation,
    [TextFillColorChangeOperation.type]: TextFillColorChangeOperation,
    [ImageAssetChangeOperation.type]: ImageAssetChangeOperation,
    [ImagePathChangeOperation.type]: ImagePathChangeOperation,
    [TextStrokeColorChangeOperation.type]: TextStrokeColorChangeOperation,
    [SolidFillColorChangeOperation.type]: SolidFillColorChangeOperation,
    [ShapeGradientFillColorStepsChangeOperation.type]: ShapeGradientFillColorStepsChangeOperation,
    [EffectFillColorChangeOperation.type]: EffectFillColorChangeOperation,
    [ShapeFillColorChangeOperation.type]: ShapeFillColorChangeOperation,
    [ShapeStrokeColorChangeOperation.type]: ShapeStrokeColorChangeOperation,
    [WaymarkVideoAssetChangeOperation.type]: WaymarkVideoAssetChangeOperation,
    [WaymarkAudioAssetChangeOperation.type]: WaymarkAudioAssetChangeOperation,
    // New change operation types
    [LayerAudioChangeOperation.type]: LayerAudioChangeOperation,
    [LayerImageChangeOperation.type]: LayerImageChangeOperation,
    [LayerVideoChangeOperation.type]: LayerVideoChangeOperation,
};

export default ChangeOperations;