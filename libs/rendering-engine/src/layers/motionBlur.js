import {
    Point3D,
    Transform,
    Rectangle,
    systems
} from 'pixi.js';
import {
    MotionBlur3DFilter
} from '../lib/pixi-filter-motion-blur-3d/index.js';

import {
    getObjectTransformAtTime
} from './tweens.js';
import settings, {
    effectQuality
} from '../settings.js';
import {
    Timeline
} from '../timeline/index.js';

const {
    FilterSystem
} = systems;

// The "kernel" size is the number of times the blur filter is applied. The higher the number, the higher quality of the blur.
// This is the mapping from the `EFFECT_QUALITY` Setting to the number of Kernels applied
// Motion Blur kernel size 5 is the lowest value that PixiJS supports.
const MOTION_BLUR_KERNEL_QUALITY = {
    [effectQuality.high]: 15,
    [effectQuality.medium]: 9,
    [effectQuality.low]: 5,
};

const FPS = 30;

// The the amount of lag the shutter has when capturing a frame.
// 0 is perfect, -1 is 1 frame behind, in After Effects this is in degrees (-360 being 1 frame behind)
const SHUTTER_PHASE = -0.25;
// S is shutter speed, A is angle, and F is frame rate.
// From: https://en.wikipedia.org/wiki/Shutter_speed
// S = A / (F * 360)
// Defaults
// 0.01666666667
const SHUTTER_ANGLE = 180;
const SHUTTER_SPEED = SHUTTER_ANGLE / (FPS * 360);

/**
 * A callback function to update our blur parameters based on the current state
 * of the objects's motion
 *
 * NOTE:
 * Because we require an updated worldTransform for a DisplayObject to calculate
 * the filter area of the object with the blur, we were running into an issue when calling
 * goToFrame to advance the timeline after the object is seen for the first time. We get into an
 * off-by-one calculation error, where we attempt to calculate the filterArea with outdated worldTransforms
 * We now call a pixiApplication.render() in renderApp before attempting to calculate the filterArea, thus giving
 * us the correct calculations.
 *
 * @param      {pixijs.DisplayObject}  displayObject  The display object
 */
function updateMotionBlur(displayObject) {
    // Don't do the work if it isn't going to be shown
    if (!displayObject.visible || !displayObject.renderable) {
        return;
    }

    const {
        layerTimeline,
        motionBlurFilter
    } = displayObject;

    // This is the time in terms of the "global" timeline
    const startTime = layerTimeline.currentGlobalTime + SHUTTER_PHASE;
    const endTime = startTime + SHUTTER_SPEED * FPS;

    // Make some object bounds to perform transformations on
    /* eslint-disable-next-line no-underscore-dangle */
    const boundsCurrent = displayObject.getTrueBounds(new Rectangle());
    const boundsStart = boundsCurrent.clone();
    const boundsEnd = boundsCurrent.clone();

    // The accumulated rotation value isn't stored on the Transform object, so we need to keep up with it
    let rotationStart = 0;
    let rotationEnd = 0;

    // The default center is based on the pivot of the moving object
    let center = displayObject.worldTransform.apply(displayObject.pivot);

    // Get transform matrices of the DisplayObject (and its linked parents) so we know what motion blur filters and their strengths
    // Loop through all linked parents to determine the transforms they might add, too
    const {
        transformStart,
        transformEnd
    } = displayObject.reduceLinkedParent(
        ({
            transformStart: parentTransformStart,
            transformEnd: parentTransformEnd
        }, currentObject) => {
            const objectTransformStart = getObjectTransformAtTime(currentObject, startTime);
            const objectTransformEnd = getObjectTransformAtTime(currentObject, endTime);

            if (
                objectTransformStart.rotation !== objectTransformEnd.rotation ||
                objectTransformStart.scale.x !== objectTransformEnd.scale.x ||
                objectTransformStart.scale.y !== objectTransformEnd.scale.y
            ) {
                // Change the center point so it's based on the lowest-order center point
                // Ex: Parent doesn't move, Child moves => Child Center
                // Ex: Parent moves, Child doesn't move => Parent Center
                center = currentObject.worldTransform.apply(currentObject.pivot);
            }

            objectTransformStart.updateTransform(parentTransformStart);
            objectTransformEnd.updateTransform(parentTransformEnd);

            rotationStart += objectTransformStart.rotation;
            rotationEnd += objectTransformEnd.rotation;

            return {
                transformStart: objectTransformStart,
                transformEnd: objectTransformEnd,
            };
        }, {
            transformStart: new Transform(),
            transformEnd: new Transform(),
        },
    );

    // Update the bounds to match the combined transform matrix of the object and its linked parents
    boundsStart.transformRectangle(transformStart.worldTransform);
    boundsEnd.transformRectangle(transformEnd.worldTransform);

    // Get the movement of the object by comparing the movement of the edges of the bounds box
    const velocityX = (boundsEnd.left - boundsStart.left + boundsEnd.right - boundsStart.right) / 2;
    const velocityY = (boundsEnd.top - boundsStart.top + boundsEnd.bottom - boundsStart.bottom) / 2;
    const velocityScaleX = (boundsEnd.width - boundsStart.width) / 2;
    const velocityScaleY = (boundsEnd.height - boundsStart.height) / 2;
    const motionBlurVelocity = new Point3D(
        velocityX,
        velocityY,
        Math.hypot(velocityScaleX, velocityScaleY) * Math.sign(velocityScaleX + velocityScaleY),
    );

    // Calculate the change in rotation
    const rotationVelocity = rotationEnd - rotationStart;

    // Modify the MotionBlur to match the current positional and rotational velocity of the object
    motionBlurFilter.velocity.copyFrom(motionBlurVelocity);
    motionBlurFilter.angle = rotationVelocity;

    // Transform the bounds to the global space
    displayObject.updateTransform();
    boundsCurrent.transformRectangle(displayObject.worldTransform);
    // The default area of the filter is the size of the object (in the global space)
    const filterArea = boundsCurrent;

    // Transform the bounds to the global space
    boundsStart.transformRectangle(displayObject.parent.worldTransform);
    boundsEnd.transformRectangle(displayObject.parent.worldTransform);
    // And add them to the filter area
    filterArea.enlarge(boundsStart);
    filterArea.enlarge(boundsEnd);

    // Expand the bounds if there is a positional velocity.
    // The z velocity is applied across the global (not local) coordinate space.
    if (motionBlurFilter.velocity.z) {
        // Add some padding for the zoom blur
        filterArea.pad(Math.abs(motionBlurFilter.velocity.z));
    }

    // Add a bit of padding for safety
    filterArea.pad(10);

    // Because the filter bounds are constrained by the size of the root composition
    const rootComposition = displayObject.getRootParent();
    const rootCompositionBounds = rootComposition.compositionBounds.clone();
    rootCompositionBounds.transformRectangle(rootComposition.worldTransform);
    const {
        x: compositionX,
        y: compositionY,
        width: compositionWidth,
        height: compositionHeight,
    } = rootCompositionBounds;

    // Shift the center point so it's located based on the filter bounds
    const {
        AUTO_FIT_BOUNDS_PADDING
    } = FilterSystem;
    center.x -= Math.max(
        Math.min(filterArea.x, compositionWidth + AUTO_FIT_BOUNDS_PADDING),
        compositionX - AUTO_FIT_BOUNDS_PADDING,
    );
    center.y -= Math.max(
        Math.min(filterArea.y, compositionHeight + AUTO_FIT_BOUNDS_PADDING),
        compositionY - AUTO_FIT_BOUNDS_PADDING,
    );

    // And update the filter center
    motionBlurFilter.center.copyFrom(center);

    /* eslint-disable-next-line no-param-reassign */
    displayObject.filterArea = filterArea;
}

const hasMotionTweens = (timeline) =>
    timeline.getPropertyTweens('position.x').length ||
    timeline.getPropertyTweens('position.y').length ||
    timeline.getPropertyTweens('scale.x').length ||
    timeline.getPropertyTweens('scale.y').length ||
    timeline.getPropertyTweens('rotation').length;

/**
 * Apply a motion blur to a display object by creating filters that respond to
 * its movement
 *
 * @param      {pixi.DisplayObject}  displayObject  The display object
 * @param      {Timeline}   timeline
 * The timeline with motion tweens for the display object.
 * Pass the timeline here so we can use it before the displayObject is officially assigned a layerTimeline
 */
export default function applyMotionBlur(displayObject, timeline) {
    const motionBlurKernelSize = MOTION_BLUR_KERNEL_QUALITY[settings.EFFECT_QUALITY];

    let shouldUseMotionBlur = hasMotionTweens(timeline);

    // Get timelines of the DisplayObject (and its linked parents) so we know what motion blur filters to use
    displayObject.forEachLinkedParent((parent) => {
        shouldUseMotionBlur = shouldUseMotionBlur || hasMotionTweens(parent.layerTimeline);
    });

    // Create a filter if it doesn't exist
    if (shouldUseMotionBlur && !displayObject.motionBlurFilter) {
        // Create a mapping object so we can reference the correct filters and point without having
        // to rely on knowing their index in the filter array.
        /* eslint-disable-next-line no-param-reassign */
        displayObject.motionBlurFilter = new MotionBlur3DFilter(
            // Velocity
            [0, 0, 0],
            // Angle
            0,
            // Center
            [0, 0, 0],
            motionBlurKernelSize,
            SHUTTER_PHASE,
        );

        // TODO: Is filter order important? Currently this adds these filters before the existing ones
        displayObject.addFilters(displayObject.motionBlurFilter);

        const updateMotionBlurHook = updateMotionBlur.bind(null, displayObject);
        timeline.registerHookCallback(Timeline.hookNames.afterPropertiesRender, updateMotionBlurHook);
        updateMotionBlur(displayObject);
    }
}