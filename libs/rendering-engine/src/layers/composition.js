// Vendor
import {
    Container,
    CompositionContainer,
    CompositionGraphics,
    Rectangle
} from 'pixi.js';
import _ from 'lodash';

// Local
import {
    getLayerType,
    layerTypes
} from '../manifest/index.js';
import {
    uuid
} from '../utils/index.js';
import settings, {
    effects
} from '../settings.js';
import applyMotionBlur from './motionBlur.js';
import {
    createWaymarkAudioFromLayer
} from './waymarkAudio/index.js';
import {
    createImageFromLayer
} from './image.js';
import {
    createNullFromLayer
} from './null.js';
import {
    createSolidFromLayer
} from './solid.js';
import {
    createShapeFromLayer
} from './shapes/index.js';
import {
    createTextFromLayer
} from './text/index.js';
import {
    createWaymarkVideoFromLayer
} from './waymarkVideo/index.js';
import {
    applyTrackMatte,
    applyMaskToLayer
} from './mask.js';
import {
    applyDisplayObjectProperties
} from './utils/index.js';
import {
    applyEffectToObject
} from './effects/index.js';
import {
    Timeline
} from '../timeline/index.js';

/**
 * Creates a dummy layer that is invisible so the we maintain the correct indexes of our layers
 * TODO: modify the bodymovin export to not need this
 *
 * @param      {object}  layerData  The layer data
 */
function createDummyLayer(layerData) {
    const layerObject = new Container();
    layerObject.name = layerData.nm;
    layerObject.visible = false;

    return layerObject;
}

/**
 * Determines if the nested tree of precomps and layers could be represented at its core, as a graphics object.
 *
 * @param      {object[]}   layerData  The exported layer data
 * @param      {object[]}   assets     The assets
 * @returns     {boolean}  True if graphics object, False otherwise.
 */
const isGraphicsObject = (layerData, assets) =>
    _.every(layerData.layers, (layer) => {
        const layerType = getLayerType(layer);
        if ([layerTypes.shape, layerTypes.solid, layerTypes.null].includes(layerType)) {
            return true;
        } else if (layerType === layerTypes.preComp) {
            // Recursively check our compositions
            const compositionData = _.find(assets, {
                id: layer.refId
            });
            return isGraphicsObject(compositionData, assets);
        }
        return false;
    });

/**
 * Creates a composition from layer.
 *
 * @param      {pixijs.Application} pixiApplication   Our pixi application
 * @param      {pixijs.Container}  container          The container for the composition
 * @param      {object}  assets                       The assets data from bodymovin
 * @param      {object}  layersData                   The layers data from bodymovin
 * @param      {number}  framesPerSecond              The frames per second
 * @param      {pixijs.Rectangle}  compositionRectangle   Rectangle housing the dimensions of the composition
 * @param      {WaymarkAuthorWebRenderer}  renderer      The renderer initiating the layer creation
 * @returns     {object}  an object containing the constructed timeline
 */
// eslint-disable-next-line import/prefer-default-export
export async function createCompositionFromLayer(
    // TODO: Don't require the application, because we'll be using our own custom one
    pixiApplication,
    // TODO: Create the container here in this function as we do with all other layers
    container,
    assets,
    layersData,
    framesPerSecond,
    compositionRectangle,
    renderer,
) {
    const timeline = new Timeline({
        target: container
    });
    // timeline.timeScale(framesPerSecond);
    /* eslint-disable-next-line no-param-reassign */
    container.compositionTimeline = timeline;

    /* eslint-disable-next-line no-param-reassign */
    container.bodymovinLayerIndex = {};

    const processedLayers = {};

    /* Allow the layers to be setup in parallel, ensuring that we still add the resulting
    displayObjects to the container in the appropriate order. */
    await Promise.all(
        layersData.map(async (layerData, index) => {
            // Create a timeline for the layer
            const layerTimeline = new Timeline();
            // Add the layer timeline to the composition timeline
            timeline.addTimeline(layerTimeline, 0);

            let layerObject;
            // Create the appropriate pixi object for this layer
            switch (getLayerType(layerData)) {
                // Composition (layer type 1)
                case layerTypes.preComp:
                    {
                        const compositionData = _.find(assets, {
                            id: layerData.refId
                        });
                        if (isGraphicsObject(compositionData, assets)) {
                            layerObject = new CompositionGraphics();
                        } else {
                            layerObject = new CompositionContainer();
                        }
                        layerObject.compositionBounds = new Rectangle(0, 0, layerData.w, layerData.h);
                        layerObject.hasCollapseTransformation = layerData.hasCollapseTransformation;
                        layerTimeline.target = layerObject;
                        layerObject.layerTimeline = layerTimeline;
                        applyDisplayObjectProperties(layerObject, layerData, layerTimeline);

                        // Framerate is 1 (so it's the same as the parent timeline)
                        // TODO: experiment with layer time stretching: 'sr'
                        const {
                            timeline: compositionTimeline
                        } = await createCompositionFromLayer(
                            pixiApplication,
                            layerObject,
                            assets,
                            compositionData.layers,
                            1,
                            // layerData.st,
                            compositionRectangle,
                            renderer,
                        );

                        layerTimeline.addTimeline(compositionTimeline, layerData.st);

                        /* Get local bounds for container to support double nested compositions.
                        In a `Container -> Container -> ...` hierarchy, the topmost container will not
                        automatically initialize its bounds to match the children. Pixi has no dirty or
                        clearDirty attribute for Containers, so we must call getLocalBounds() manually. */
                        layerObject.getLocalBounds();
                        break;
                    }

                    // Solids (layer type 1)
                case layerTypes.solid:
                    {
                        layerObject = createSolidFromLayer(layerData, layerTimeline);
                        break;
                    }

                    // Images (layer type 2)
                case layerTypes.image:
                    {
                        layerObject = await createImageFromLayer(layerData, assets, layerTimeline);
                        break;
                    }

                    // Null layers (layer type 3)
                case layerTypes.null:
                    {
                        layerObject = createNullFromLayer(layerData, layerTimeline);
                        break;
                    }

                    // Shapes (layer type 4)
                case layerTypes.shape:
                    {
                        layerObject = createShapeFromLayer(layerData, layerTimeline);
                        break;
                    }

                    // Text (layer type 5)
                case layerTypes.text:
                    {
                        layerObject = await createTextFromLayer(layerData, assets, layerTimeline);
                        break;
                    }

                    // Audio (layer type 6)
                case layerTypes.audio:
                    {
                        // Standard audio layers aren't supported but nearly all templates still contain one or
                        // more audio layers of this type. This error is disabled to declutter the console logs
                        // for those templates.
                        // console.error('Audio layers are not supported. Use Waymark audio layer type instead.');
                        // Keeping the indexes in line by creating a no-op layer
                        layerObject = createDummyLayer(layerData);
                        break;
                    }

                    // Videos (layer type 9)
                case layerTypes.video:
                    {
                        console.error('Video layers are not supported. Use Waymark video layer type instead.');
                        // Keeping the indexes in line by creating a no-op layer
                        layerObject = createDummyLayer(layerData);
                        break;
                    }

                    // Waymark video (layer type 100)
                case layerTypes.waymarkVideo:
                    {
                        layerObject = await createWaymarkVideoFromLayer(
                            layerData,
                            assets,
                            layerTimeline,
                            pixiApplication,
                            framesPerSecond,
                            renderer,
                        );
                        break;
                    }

                    // Waymark audio (layer type 101)
                case layerTypes.waymarkAudio:
                    {
                        layerObject = await createWaymarkAudioFromLayer({
                                ...layerData,
                                waymarkId: _.get(layerData, 'meta.id'),
                            },
                            assets,
                            layerTimeline,
                            framesPerSecond,
                            renderer,
                        );
                        break;
                    }

                    // Empty layer
                default:
                    {
                        // Keeping the indexes in line by creating a no-op layer
                        layerObject = createDummyLayer(layerData);
                        break;
                    }
            }

            // The layer is hidden, make it unrenderable, so we can keep the indexes in line
            if (layerData.hd) {
                layerObject.renderable = false;
                layerObject.isHidden = true;
            }

            // Cache the layer with the index ID created during the composition export.
            // eslint-disable-next-line no-param-reassign
            container.bodymovinLayerIndex[layerData.ind] = layerObject;

            // Assign the uuid or id to the layer
            layerObject.waymarkUUID = _.get(layerData, 'meta.uuid', uuid());

            layerTimeline.target = layerObject;
            layerObject.layerTimeline = layerTimeline;

            // Add the completed layer to our mapping, to be added to the stage once all layers are processed.
            processedLayers[index] = layerObject;
        }),
    );

    /* With all layers now initially processed, add them to the container, ensuring
    we're respecting the intended display order (same as the order of the original
    `layersData` array). */
    const sortedIndexes = Object.keys(processedLayers).sort((a, b) => a - b);
    sortedIndexes.forEach((layerIndex) => {
        container.addChildAt(processedLayers[layerIndex], 0);
    });

    // Now that all of the layers have been added, perform operations that
    // require referenced layers to exist, starting with transform parents.
    layersData.forEach((layerData) => {
        const layerObject = container.bodymovinLayerIndex[layerData.ind];

        // If the layer has a parent (which its transforms are linked to) apply the transform parent
        // TODO: Hidden layers must be exported and hidden, as the 'parent' id is will still
        // reference the same index regardless of if the layer is exported or not
        if (layerData.parent) {
            const transformParent = container.bodymovinLayerIndex[layerData.parent];

            if (!transformParent) {
                console.error(
                    `Linked Parent for layer ${layerObject.name}: ${layerObject.waymarkId ||
            layerObject.waymarkUUID} was not exported`,
                );
            } else {
                layerObject.setLinkedParent(transformParent);
            }
        }

        // Add our Track Matte masks
        if (_.isNumber(layerData.tt)) {
            const previousIndex = layerData.ind - 1;
            const trackMatteObject = container.bodymovinLayerIndex[previousIndex];

            if (!trackMatteObject) {
                console.error(
                    `Track Matte for layer ${layerObject.name}: ${layerObject.waymarkId ||
            layerObject.waymarkUUID} was not exported`,
                );
            } else {
                applyTrackMatte(layerObject, trackMatteObject, layerData.tt);
            }
        }

        if (layerData.ef) {
            const layerDataEffects = layerData.ef || [];

            layerDataEffects.forEach((effect) => {
                applyEffectToObject(layerObject, effect, layerObject.layerTimeline);
            });
        }

        // Add our Masks
        // Due to an order-of-operations problem, we need to actually create mask layers after effects and track mattes.
        // By moving our mask creation and parenting until after that, we can make sure masks are sized appropriately.
        if (layerData.masksProperties) {
            // Layers that have mask properties on them are applied differently
            const mask = applyMaskToLayer(layerObject, layerData, layerObject.layerTimeline);
            // If the layer has a parent (which its transforms are linked to) apply the transform parent to the mask as well.
            if (layerData.parent && mask) {
                const transformParent = container.bodymovinLayerIndex[layerData.parent];
                mask.setLinkedParent(transformParent);
            }
        }

        // Apply the motion blur for the first time now that objects have linked parents and are addded to the composition
        // (it get re-applied on applyChange calls)
        if (
            layerData.hasMotionBlur &&
            // Only apply motion blur if the layer isn't a track matte
            !layerData.td &&
            // Only apply motion blur if the layer doesn't have collapseTransformation turned on
            !layerData.hasCollapseTransformation &&
            !settings.DISABLED_EFFECTS.includes(effects.motionBlur)
        ) {
            applyMotionBlur(layerObject, layerObject.layerTimeline);
        }
    });

    return {
        timeline,
    };
}