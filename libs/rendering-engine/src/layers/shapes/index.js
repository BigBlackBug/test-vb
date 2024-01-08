// Vendor
import {
    Graphics
} from 'pixi.js';

// Local
import {
    applyTransformsToObject,
    applyDisplayObjectProperties,
    applyBlendMode,
    setDirty,
} from '../utils/index.js';
import applyEllipsePropertiesFromBodymovin from './ellipse.js';
import applyFillPropertiesFromBodymovin from './fill.js';
import applyGradientFillPropertiesFromBodymovin from './gradientFill.js';
import applyPathPropertiesFromBodymovin from './path.js';
import applyRectanglePropertiesFromBodymovin from './rectangle.js';
import applyStarPropertiesFromBodymovin from './star.js';
import applyStrokePropertiesFromBodymovin from './stroke.js';
import applyTrimPathPropertiesFromBodymovin from './trimPaths.js';
import {
    Timeline
} from '../../timeline/index.js';

export {
    getVerticiesOfPath
}
from './utils.js';
export {
    applyPathPropertiesFromBodymovin
};
export {
    constructPolyBezierFromData
}
from './path.js';

// Mapping of human-readable shape types to the 'ty' property
const SHAPE_TYPES = {
    group: 'gr',
    transform: 'tr',
    stroke: 'st',
    gradientStroke: 'gs',
    fill: 'fl',
    gradientFill: 'gf',
    path: 'sh',
    rectangle: 'rc',
    ellipse: 'el',
    star: 'sr',
    mergePaths: 'mm',
    trimPaths: 'tm',
    roundCorners: 'rd',
};

/**
 * Applies shape properties to a graphic based on the shape type.
 * If shapes have drawing operations, they will return a callback that take a graphics object to operate on and will perform
 * drawing operations (like drawRect, bezierCurveTo etc).
 *
 * ex:
 * returns (graphic) => {
 *  graphic.drawRect(0,0,100,100)
 * }
 *
 * Shapes with style operations will similarly return a callback that take a graphics object to operate on. That callback will
 * perform operations like beginFill or setting a lineStyle. The callback will return a cleanup callback which reverts or removes
 * the style changes made.
 * ex:
 * const cleanup = (graphic) => {
 *   graphic.endFill()
 * }
 * const setup = (graphic) => {
 *   graphic.beginFill(0x00FFCC)
 * }
 * return setup
 *
 * @param      {pixijs.Graphic}      graphic   The graphic
 * @param      {object}              shape     The shape properties from bodymovin
 * @param      {Timeline}  timeline  The timeline to apply tweens to
 */
export function applyShapePropertyFromBodymovin(graphic, shape, timeline) {
    let callback = null;
    let isAnimated = false;
    let isStyleCallback = false;

    // If the shape is "hidden", don't apply a graphic property for it
    if (shape.hd) {
        return {
            callback,
            isAnimated,
            isStyleCallback,
        };
    }

    switch (shape.ty) {
        // Apply Transform Properties
        case SHAPE_TYPES.transform:
            {
                applyTransformsToObject(graphic, shape, timeline);
                break;
            }
            // Apply Stroke Properties
        case SHAPE_TYPES.stroke:
            {
                ({
                    callback,
                    isAnimated
                } = applyStrokePropertiesFromBodymovin(graphic, shape, timeline));
                isStyleCallback = true;
                break;
            }
            // TODO: Apply Gradient Stroke
        case SHAPE_TYPES.gradientStroke:
            {
                break;
            }
            // Apply Fill Properties
        case SHAPE_TYPES.fill:
            {
                ({
                    callback,
                    isAnimated
                } = applyFillPropertiesFromBodymovin(graphic, shape, timeline));
                isStyleCallback = true;
                break;
            }
            // Apply Gradient Fill
        case SHAPE_TYPES.gradientFill:
            {
                ({
                    callback,
                    isAnimated
                } = applyGradientFillPropertiesFromBodymovin(
                    graphic,
                    shape,
                    timeline,
                ));
                isStyleCallback = true;
                break;
            }
            // Apply Path Properties
        case SHAPE_TYPES.path:
            {
                ({
                    callback,
                    isAnimated
                } = applyPathPropertiesFromBodymovin(graphic, shape, timeline));
                break;
            }
            // Apply Rectangle
        case SHAPE_TYPES.rectangle:
            {
                ({
                    callback,
                    isAnimated
                } = applyRectanglePropertiesFromBodymovin(graphic, shape, timeline));
                break;
            }
            // Apply Ellipse
        case SHAPE_TYPES.ellipse:
            {
                ({
                    callback,
                    isAnimated
                } = applyEllipsePropertiesFromBodymovin(graphic, shape, timeline));
                break;
            }
            // Apply Star
        case SHAPE_TYPES.star:
            {
                ({
                    callback,
                    isAnimated
                } = applyStarPropertiesFromBodymovin(graphic, shape, timeline));
                break;
            }
            // TODO: Apply Merge
        case SHAPE_TYPES.mergePaths:
            {
                break;
            }
        case SHAPE_TYPES.trimPaths:
            {
                ({
                    isAnimated
                } = applyTrimPathPropertiesFromBodymovin(graphic, shape, timeline));
                break;
            }
            // TODO: Apply Rounded Corners
        case SHAPE_TYPES.roundCorners:
            {
                break;
            }
        default:
            {
                break;
            }
    }

    return {
        callback,
        isStyleCallback,
        isAnimated,
    };
}

/**
 * This is the primary function for drawing a Graphics object based on Bodymovin output.
 * Updates a graphics object with an array of callbacks for the object to update properties and draw.
 *
 * Performs the the drawing operation on styles up to the length in the stack.
 * Take this layer stack for example (reversed from what it is in after effects):
 * - Fill
 * - Stroke 1
 * - Group
 *    - Ellipse
 *    - Stroke 2
 *    - Star
 * - Rectangle
 *
 * We should end up with a drawing (bottom to top) order of:
 * - Filled Ellipse
 * - Filled Star
 * - Filled Rectangle
 * - Stroked 1 Ellipse
 * - Stroked 1 Star
 * - Stroked 1 Rectangle
 * - Stroked 2 Star
 *
 * TODO: Fix the incorrect the rendering order with nested groups.
 * Currently, while shapes inside groups will recieve the correct drawing and style operations,
 * they will be renderered in order of where the drawing operations (rect, path, etc.) appear in the shapes array, not the
 * style operations. To accomodate this, signficant work on nested (child) graphics objects and their independent transforms
 * need to be done so we can draw in the correct order. If we were to draw in style order, child shapes could be drawn without their
 * transforms currently.
 * (for a live example see the commented-out tests in test/layers/shapes/nesting/nesting.js)
 *
 * For the above example our shapes render in the (bottom to top) order:
 * - Filled Rectangle
 * - Stroked 1 Rectangle
 * - Filled Ellipse
 * - Filled Star
 * - Stroked 1 Ellipse
 * - Stroked 1 Star
 * - Stroked 2 Star
 *
 * @param      {PIXI.Graphics}  graphicsObject          The graphics object
 * @param      {object[]}       drawingUpdateCallbacks  The callbacks for drawing graphics
 * @param      {function[]}     styleUpdateCallbacks    The callbacks for each style property of a shape
 */
function updateShape(graphicsObject, drawingUpdateCallbacks, styleUpdateCallbacks) {
    graphicsObject.clear();
    graphicsObject.callAllChildren(Graphics.prototype.clear);

    // For each of our style operations, perform a draw operation with a given style callback
    styleUpdateCallbacks.forEach((styleCallback) => {
        const drawingCallbacks = drawingUpdateCallbacks.filter(({
                styleCallbacks
            }) =>
            styleCallbacks.includes(styleCallback),
        );
        drawingCallbacks.forEach(({
            callback,
            graphics
        }) => {
            const styleCallbackCleanup = styleCallback(graphics);
            callback(graphics);
            styleCallbackCleanup(graphics);
        });
    });

    graphicsObject._populateBatches();
    graphicsObject.calculateBounds();
    graphicsObject.calculateVertices();
}

/**
 * Creates a graphic group from a bodymovin shape export.
 *
 * @param      {object}             shapeData             The shape data
 * @param      {Timeline}           timeline              The timeline to apply tweens to
 * @param      {number}             parentBlendMode       The blend mode of the parent, which gets passed down if one isn't available
 * @param      {function[]}         parentStyleCallbacks  An array of callbacks that change the style and drawing operations of a graphics
 * @param      {PIXI.DisplayObject} existingShape         An existing object, if we're recreating
 */
export function createGroupFromBodymovin(
    shapeData,
    timeline,
    parentBlendMode,
    parentStyleCallbacks,
    existingShape,
) {
    let shape = existingShape;
    if (!existingShape) {
        shape = new Graphics();
    }
    shape.name = shapeData.nm;
    shape.layerTimeline = new Timeline({
        target: shape
    });
    timeline.addTimeline(shape.layerTimeline, 0);

    let isAnimated = false;
    const drawingUpdateCallbacks = [];
    const groupStyleUpdateCallbacks = [];
    const styleUpdateCallbacks = [];

    const blendMode = shapeData.bm || parentBlendMode;
    if (blendMode) {
        applyBlendMode(shape, blendMode);
    }

    // If we're top-level this key is 'shapes', otherwise it's 'it'
    const shapesArray = shapeData.shapes || shapeData.it;
    // Reverse the draw order so we draw from bottom up.
    // We create a new array so we don't mutate the itemArray
    const reversedArray = [...shapesArray].reverse();

    reversedArray.forEach((shapeItemData, index) => {
        if (shapeItemData.ty === SHAPE_TYPES.group) {
            const groupProperties = createGroupFromBodymovin(
                shapeItemData,
                timeline,
                blendMode,
                styleUpdateCallbacks,
            );

            // If one property is animated, we consider the whole shape animated
            isAnimated = isAnimated || groupProperties.isAnimated;

            // We don't directly add these to the styleUpdateCallbacks because we don't want this current layer to
            // render using the style callbacks from the nest group. We'll add them back later at their prescribed index.
            groupStyleUpdateCallbacks.push({
                index,
                callbacks: groupProperties.styleUpdateCallbacks,
            });
            drawingUpdateCallbacks.push(...groupProperties.drawingUpdateCallbacks);
            shape.addChild(groupProperties.shape);
        } else {
            const {
                callback,
                isStyleCallback,
                isAnimated: isPropertyAnimated,
            } = applyShapePropertyFromBodymovin(shape, shapeItemData, shape.layerTimeline);

            // If one property is animated, we consider the whole shape animated
            isAnimated = isAnimated || isPropertyAnimated;

            if (callback) {
                if (isStyleCallback) {
                    styleUpdateCallbacks.push(callback);
                } else {
                    drawingUpdateCallbacks.push({
                        callback,
                        // These are the callbacks to apply style methods for this drawing callback
                        styleCallbacks: [...parentStyleCallbacks, ...styleUpdateCallbacks],
                        graphics: shape,
                    });
                }
            }
        }
    });

    // Re-insert group callbacks at the desired index
    groupStyleUpdateCallbacks.reverse().forEach(({
        index,
        callbacks
    }) => {
        styleUpdateCallbacks.splice(index, 0, ...callbacks);
    });

    return {
        shape,
        drawingUpdateCallbacks,
        styleUpdateCallbacks,
        isAnimated,
    };
}

/**
 * Creates a Graphic from a shape layer exported from bodymovin.
 *
 * @param      {object}  layerData            The layer data from bodymovin
 * @param      {Timeline}  timeline  The layer timeline
 * @param      {Object}  [options={}]         The additional options
 * @return     {PIXI.Graphics}                The graphics object representing this layer
 */
export function createShapeFromLayer(layerData, timeline, options = {}) {
    const {
        object
    } = options;
    const {
        currentTime
    } = timeline;
    if (object) {
        object.clear();
        object.children.forEach((child) => {
            child.clear();
        });
        object.removeChildren();
        if (object.layerTimeline) {
            object.layerTimeline.destroy();
        }
        setDirty(object);
    }

    const {
        shape,
        drawingUpdateCallbacks,
        styleUpdateCallbacks,
        isAnimated
    } =
    createGroupFromBodymovin(layerData, timeline, 0, [], object);

    // Register an update callback for the layer to redraw on each frame in response to changing drawing operations
    // TODO: If the graphic never changes, never perform an onUpdate call for performance benefits
    if (drawingUpdateCallbacks.length && styleUpdateCallbacks.length) {
        updateShape(shape, drawingUpdateCallbacks, styleUpdateCallbacks);

        if (isAnimated) {
            timeline.registerHookCallback(
                Timeline.hookNames.rendering,
                updateShape.bind(null, shape, drawingUpdateCallbacks, styleUpdateCallbacks),
            );
        }
        // TODO: Additionaly we can gain a performance and alaising boost by caching these
        //       Shapes, but there's been a bit of struggle around getting them to work
        // else {
        //  shape.cacheAsBitmap = true;
        //  // Pass in the renderer as an option
        //  shape.render(renderer);
        // }
    }

    applyDisplayObjectProperties(shape, layerData, timeline);

    // Make sure the timeline's (and its children's) current time is the same if we had to destroy it earlier
    // eslint-disable-next-line no-param-reassign
    timeline.currentTime = currentTime;

    return shape;
}