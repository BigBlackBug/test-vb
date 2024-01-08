// eslint-disable-next-line no-unused-vars
import enableAlphaSpriteMaskFilterProperties from './AlphaSpriteMaskFilter/AlphaSpriteMaskFilter.js';
import enableBitmapText from './text-bitmap/index.js';
import enableBoundsProperties from './Bounds.js';
import enableContainerProperties from './Container.js';
import enableCompositionContainerProperties from './CompositionContainer.js';
import enableCompositionGraphicsProperties from './CompositionGraphics.js';
import enableDisplayObjectProperties from './DisplayObject.js';
import enableFilterSystemProperties from './FilterSystem.js';
import enableGraphicsProperties from './Graphics.js';
import enableLinkedParentProperties from './LinkedParent.js';
import enableLoaderProperties from './Loader.js';
import enableMaskSystemProperties from './MaskSystem.js';
import enableRectangleProperties from './Rectangle.js';
import enableSpriteProperties from './Sprite.js';
import enableTextProperties from './TextObject.js';
import enableTextMetricsTextBox from './TextMetrics.js';
import enableTextStyleProperties from './TextStyle.js';
import enableTransformProperties from './Transform.js';
import enableObservablePoint3D from './ObservablePoint3D.js';
import enablePoint3D from './Point3D.js';

/**
 * Prevent our video textures from updating more than 30 FPS
 * for performance reasons.
 *
 * @param      {object}  pixiNamespace  The pixi namespace
 */
// eslint-disable-next-line no-unused-vars
function enableVideoTextureThrottle(pixiNamespace) {
    // eslint-disable-next-line no-param-reassign
    // PIXI V5 TODO: Removed becuase is was triggering an error.
    // pixiNamespace.VideoBaseTexture.prototype.update = _.throttle(
    //   pixiNamespace.VideoBaseTexture.prototype.update,
    //   33,
    // );
}

/**
 * Enables custom properties and methods on PixiJS objects.
 *
 * @param      {object}  pixiNamespace  The pixi namespace
 */
export default function enableCustomPixiJSProperties(pixiNamespace) {
    // Using WebGL1 instead of WebGL2 to solve issues while creating shaders when creating the ColorMatrixFilter
    // eslint-disable-next-line no-param-reassign
    pixiNamespace.settings.PREFER_ENV = pixiNamespace.ENV.WEBGL_LEGACY;

    pixiNamespace.utils.skipHello();

    enableLoaderProperties(pixiNamespace);
    enableAlphaSpriteMaskFilterProperties(pixiNamespace);
    enableBitmapText(pixiNamespace);
    enableDisplayObjectProperties(pixiNamespace);
    enableFilterSystemProperties(pixiNamespace);
    enableBoundsProperties(pixiNamespace);
    enableCompositionContainerProperties(pixiNamespace);
    enableCompositionGraphicsProperties(pixiNamespace);
    enableContainerProperties(pixiNamespace);
    enableLinkedParentProperties(pixiNamespace);
    enableGraphicsProperties(pixiNamespace);
    enableMaskSystemProperties(pixiNamespace);
    enableRectangleProperties(pixiNamespace);
    enableSpriteProperties(pixiNamespace);
    enableTextProperties(pixiNamespace);
    enableTextMetricsTextBox(pixiNamespace);
    enableTextStyleProperties(pixiNamespace);
    enableTransformProperties(pixiNamespace);
    enableVideoTextureThrottle(pixiNamespace);
    enableObservablePoint3D(pixiNamespace);
    enablePoint3D(pixiNamespace);
}