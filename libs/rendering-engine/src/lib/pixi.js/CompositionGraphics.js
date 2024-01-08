/* eslint-disable no-param-reassign, no-underscore-dangle */
import compositionMixins from './compositionMixins.js';

export default function enableCompositionGraphicsProperties(pixiNamespace) {
    /**
     * Class for a composition container. This object represents a composition in AE
     * by having bounds and a mask around those bounds (unlike traditional Containers).
     * The CompositionGraphics represents its mask as Graphics object to utilize benefits
     * of stencil masking.
     *
     * @class      CompositionGraphics (name)
     */
    class CompositionGraphics extends pixiNamespace.Graphics {
        constructor() {
            super();
            this._compositionBounds = new pixiNamespace.Rectangle();
            this._compositionMask = this.createCompositionMask();
            this.hasCollapseTransformation = false;
        }

        /**
         * Limit the bounds of the Container to that of the set composition size (via the mask),
         * unless hasCollapseTransformation is true
         * This would mean if hasCollapseTransformation=false the bounds is drawn without concern for the size of children.
         */
        calculateBounds() {
            if (this.hasCollapseTransformation) {
                super.calculateBounds();
            } else {
                this.compositionMask.parent = this;
                this.compositionMask.calculateBounds();
                this._bounds = this.compositionMask._bounds.clone();
                this.compositionMask.parent = null;
            }
        }

        /**
         * The the bound of an object without any transform applied.
         * Ex: A 100px wide square with a scale of .5 is reported to be 50px wide by getLocalBounds.
         *     This would report a width of 100px.
         * Limit the bounds of the Container to that of the set composition size (via the mask),
         * unless hasCollapseTransformation is true
         *
         * @param      {PIXI.Rectangle}  rectangle  An optional rectangle to copy the bounds to
         * @return     {PIXI.Rectangle}  The true bounds.
         */
        getTrueBounds(rectangle) {
            if (this.hasCollapseTransformation) {
                return super.getLocalBounds(rectangle);
            }
            return this.compositionMask.getLocalBounds(rectangle);
        }

        /**
         * The the bound of an object without any transform applied.
         * Ex: A 100px wide square with a scale of .5 is reported to be 50px wide by getLocalBounds.
         *     This would report a width of 100px.
         * Limit the bounds of the Container to that of the set composition size (via the mask),
         * unless hasCollapseTransformation is true
         *
         * @param      {PIXI.Rectangle}  rectangle  An optional rectangle to copy the bounds to
         * @return     {PIXI.Rectangle}  The true bounds.
         */
        getLocalBounds(rectangle) {
            if (this.hasCollapseTransformation) {
                return super.getLocalBounds(rectangle);
            }
            return this.compositionMask.getLocalBounds(rectangle);
        }

        /**
         * Override the default updateTransform to also update the composition mask
         */
        updateTransform() {
            super.updateTransform();
            this.compositionMask.updateTransform();
        }

        render(renderer) {
            this.compositionMask.name = `${this.name}__Composition_Mask`;

            // if the object is not visible or the alpha is 0 then no need to render this element
            if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
                return;
            }

            // do a quick check to see if this element has a mask or a filter.
            if (this._mask || this.compositionMask || this.filters) {
                // If this doesn't have a mask, but has a composition mask,
                // consider that the mask we want to use
                let shouldResetMask = false;
                if (!this._mask &&
                    this.compositionMask &&
                    !this.hasCollapseTransformation &&
                    !this.isMask
                ) {
                    this._mask = this.compositionMask;
                    shouldResetMask = true;
                }

                this.renderAdvanced(renderer);

                // Reset it after the render operation
                if (shouldResetMask) {
                    this._mask = null;
                }
            } else if (this.cullable) {
                this._renderWithCulling(renderer);
            } else {
                this._render(renderer);

                // simple render children!
                for (let i = 0, j = this.children.length; i < j; i += 1) {
                    this.children[i].render(renderer);
                }
            }
        }
    }

    CompositionGraphics.mixin(compositionMixins);

    pixiNamespace.CompositionGraphics = CompositionGraphics;
}