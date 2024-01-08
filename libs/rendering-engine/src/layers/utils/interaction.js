import {
    Rectangle
} from 'pixi.js';

/**
 * Gets all of the objects with bounds under the interaction event
 * NOTE: This is not a substitute for a hitBox test, and shapes, rotated objects, etc will be
 *       considered hit if their axis-oriented bounding box contains the interaction, even if the
 *       actual visual area of the object is not under the interaction.
 *
 * @param      {PIXI.InteractionEvent}     event     The event
 * @param      {WaymarkAuthorWebRenderer}  renderer  The renderer
 * @return     {PIXI.DisplayObject[]}  The display objects under a interaction.
 */
// eslint-disable-next-line import/prefer-default-export
export const getObjectsUnderInteraction = (event, renderer) => {
    const interactionManager = renderer.pixiApplication.renderer.plugins.interaction;
    const layers = [];
    interactionManager.processInteractive(
        event,
        renderer.pixiApplication.stage,
        // Process Interactive provides a callback which is called on every visible object on the stage
        (interactionEvent, displayObject) => {
            // Take the bounds of the object and transform them to the world stage
            const bounds = displayObject.getTrueBounds(new Rectangle());
            bounds.transformRectangle(displayObject.worldTransform);
            const {
                x,
                y
            } = interactionEvent.data.global;

            // If the interaction is inside the bounds, add it to the list of layers
            if (bounds.contains(x, y)) {
                layers.push(displayObject);
            }
        },
    );

    return layers;
};