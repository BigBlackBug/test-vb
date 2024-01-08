/* eslint-disable no-console, no-param-reassign */
import {
    Graphics,
    Rectangle
} from 'pixi.js';

import {
    Timeline
} from '../timeline/index.js';

/**
 * ===============
 * PIXIJS DISPLAY OBJECT METHODS
 * ===============
 */

/**
 * Registers click events on display objects
 *
 * @param      {pixijs.DisplayObject}  displayObject    The display object
 * * @param      {type}                  eventType        The name of the event trigger
 * @param      {function}              loggingCallback  The logging callback, should take a single 'event' parameter from pixijs
 * @param      {*}                     callbackContext  The logging callback context, the "this" the callback is called with
 */
export function registerInteractiveEvents(
    displayObject,
    eventType,
    loggingCallback,
    callbackContext,
) {
    if (displayObject.children) {
        displayObject.children.forEach((child) => {
            registerInteractiveEvents(child, eventType, loggingCallback, callbackContext);
        });
    }

    // eslint-disable-next-line no-param-reassign
    displayObject.interactive = true;
    displayObject.on(eventType, loggingCallback, callbackContext);
}

/**
 * Unregisters the click events and turns the interactivity on the objects to false
 *
 * @param      {pixijs.DisplayObject}  displayObject    The display object
 * @param      {type}                  eventType        The name of the event trigger
 * @param      {function}              loggingCallback  The logging callback
 * @param      {*}                     callbackContext  The logging callback context, the "this" the callback is called with
 */
export function unregisterInteractiveEvents(
    displayObject,
    eventType,
    loggingCallback,
    callbackContext,
) {
    if (displayObject.children) {
        displayObject.children.forEach((child) => {
            unregisterInteractiveEvents(child, eventType, loggingCallback, callbackContext);
        });
    }

    // eslint-disable-next-line no-param-reassign
    displayObject.interactive = false;
    displayObject.off(eventType, loggingCallback, callbackContext);
}

/**
 * Updates the outline object to draw the bounds of the passed display object
 *
 * @param      {pixijs.DisplayObject}  displayObject         The displayObject
 * @param      {pixijs.Graphics}  outlineObject  The displayObject's outline shape
 */
export function updateObjectOutline(displayObject, outlineObject) {
    // Clear out drawing data
    outlineObject.clear();

    if (!displayObject.worldVisible || displayObject.worldAlpha === 0) {
        return;
    }

    const bounds = displayObject.getTrueBounds(new Rectangle());
    const displayObjectTransform = displayObject.worldTransform.clone();

    // Because the outline object is added as a child to the root composition,
    // it will inherit the root composition's transforms (ex: if it is scaled).
    // We remove that transform here before adding it as a child, so it is not applied twice.
    const rootComposition = displayObject.getRootParent();
    const rootCompositionTransform = rootComposition.worldTransform.clone();
    rootCompositionTransform.invert();
    displayObjectTransform.prepend(rootCompositionTransform);

    bounds.transformRectangle(displayObjectTransform);

    // Create a red box for the filter area
    if (displayObject.filterArea) {
        const filterArea = displayObject.filterArea.clone();
        filterArea.transformRectangle(rootCompositionTransform);

        const {
            x,
            y,
            width,
            height
        } = filterArea;
        outlineObject.lineStyle(3, 0xff7878);
        outlineObject.beginFill(0xff7878, 0.15, 1, 0);
        outlineObject.drawRect(x, y, width, height);
        outlineObject.endFill();
    }

    // Create a light blue box
    outlineObject.lineStyle(3, 0x00ffff);
    outlineObject.beginFill(0x00ffff, 0.15, 1, 0);
    outlineObject.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
    outlineObject.endFill();

    // Create a dot for the center
    const point = displayObjectTransform.apply(displayObject.pivot);
    outlineObject.beginFill(0x00ffff, 1, 1, 0);
    outlineObject.drawEllipse(point.x, point.y, 5, 5);
    outlineObject.endFill();
}

/**
 * Creates an outline object to show the bounds of a DisplayObject.
 *
 * @param      {pixijs.displayObject}      displayObject  The display object
 * @param      {WaymarkAuthorWebRenderer}  renderer       The renderer
 * @return     {Promise}
 */
// eslint-disable-next-line consistent-return
export async function createOutlineObject(displayObject, renderer) {
    /**
     * Only make outlines for objects that
     *  1) Aren't the root stage,
     *  2) Don't already have an outline
     */
    if (displayObject.parent && !displayObject.debugOutlineObject) {
        const outlineObject = new Graphics();
        outlineObject.name = `${displayObject.name} Outline`;
        displayObject.debugOutlineObject = outlineObject;
        // Start the object off with a correct draw
        updateObjectOutline(displayObject, outlineObject);
        // Add the outline as a sibling to the displayObject
        renderer.pixiApplication.stage.addChild(outlineObject);
        // Whenever the object updates, update the outline object
        const updateObjectOutlineHook = updateObjectOutline.bind(null, displayObject, outlineObject);
        displayObject.updateObjectOutlineHook = updateObjectOutlineHook;
        if (displayObject.layerTimeline) {
            displayObject.layerTimeline.registerHookCallback(
                Timeline.hookNames.afterPropertiesRender,
                updateObjectOutlineHook,
            );
        }

        return renderer.renderApp();
    }
}

/**
 * Removes a DisplayObject's outline object and remove the listeners
 *
 * @param      {pixijs.DisplayObject}      displayObject  The display object
 * @param      {WaymarkAuthorWebRenderer}  renderer       The renderer
 * @return     {Promise}
 */
// eslint-disable-next-line consistent-return
export async function removeOutlineObject(displayObject, renderer) {
    if (displayObject.debugOutlineObject) {
        renderer.pixiApplication.stage.removeChild(displayObject.debugOutlineObject);
        displayObject.debugOutlineObject = null;
        if (displayObject.layerTimeline) {
            displayObject.layerTimeline.removeHookCallback(
                'onUpdate',
                displayObject.updateObjectOutlineHook,
            );
        }
        return renderer.renderApp();
    }
}