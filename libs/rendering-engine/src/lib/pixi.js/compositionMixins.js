/* eslint-disable no-underscore-dangle */
import {
    Graphics,
    Rectangle
} from 'pixi.js';

// Shared Getters and Setters with the CompositionContainer and CompositionGraphics
const compositionMixins = {
    // The Rectangle that represents the size of the composition
    get compositionBounds() {
        // If one hasn't been set yet, make sure we have something to operate on.
        if (!this._compositionBounds) {
            this._compositionBounds = new Rectangle();
        }
        return this._compositionBounds;
    },
    set compositionBounds(bounds) {
        this._compositionBounds.copyFrom(bounds);
        // Reset the mask size now that the composition has changed
        this.compositionMask = this.createCompositionMask();
    },

    // The mask that cuts off content at the bounds unless hasCollapseTransformation is true
    get compositionMask() {
        return this._compositionMask;
    },
    set compositionMask(compositionMask) {
        this._compositionMask = compositionMask;
    },

    /*
      If the layer does not have `hasCollapseTransformation`, apply a mask the size of the container.
      In After Effects, each composition is cropped to it’s width and height, so if you
      have nested compositions, elements from a nested composition won’t bleed outside
      of its set bounds. PixiJS doesn’t implement that "cropping" by default, so we
      make a mask to cut off any elements that bleed outside the bounds of the composition.
    */
    get hasCollapseTransformation() {
        return this._hasCollapseTransformation;
    },
    set hasCollapseTransformation(hasCollapseTransformation) {
        this._hasCollapseTransformation = hasCollapseTransformation;
    },

    /**
     * Creates a composition mask as a Graphics object. Optimized for Stencil/FastRect masks.
     * @return     {PIXI.Graphics}
     */
    createCompositionMask() {
        const compositionMask = new Graphics();
        compositionMask.beginFill(0x000000);
        compositionMask.drawRect(
            this.compositionBounds.x,
            this.compositionBounds.y,
            this.compositionBounds.width,
            this.compositionBounds.height,
        );
        compositionMask.endFill();

        compositionMask.transform = this.transform;
        compositionMask.renderable = false;
        return compositionMask;
    },
};

export default compositionMixins;