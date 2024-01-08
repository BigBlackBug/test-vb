/* eslint-disable no-param-reassign, no-underscore-dangle */
import compositionMixins from './compositionMixins.js';

export default function enableCompositionContainerProperties(pixiNamespace) {
    /**
     * Class for a composition container. This object represents a composition in AE
     * by having bounds and a mask around those bounds (unlike traditional Containers).
     * The CompositionContainer represents its mask as Sprite object because we have to
     * use Sprites for caching container content.
     *
     * @class      CompositionContainer (name)
     */
    class CompositionContainer extends pixiNamespace.Container {
        constructor() {
            super();
            this._isMask = false;
            this._compositionBounds = new pixiNamespace.Rectangle();
            this._compositionMask = this.createCompositionMask();
            this.hasCollapseTransformation = false;
        }

        // We're storing isMask differently that Pixi, so we can trigger a regeneration of the
        // composition mask when it changes
        get isMask() {
            return this._isMask;
        }
        set isMask(isMask) {
            this._isMask = isMask;
            // Reset the mask type when isMask changes
            this.compositionMask = this.createCompositionMask();
        }

        /**
         * Limit the bounds of the Container to that of the set composition size,
         * unless hasCollapseTransformation is true
         * This would mean if hasCollapseTransformation=false the bounds is drawn without concern for the size of children.
         */
        calculateBounds() {
            if (this.hasCollapseTransformation) {
                super.calculateBounds();
            } else {
                this.compositionMask.calculateBounds();
                this._bounds = this.compositionMask._bounds.clone();
            }
        }

        /**
         * Limit the bounds of the Container to that of the set composition size (via the mask),
         * unless hasCollapseTransformation is true.
         * This would mean if hasCollapseTransformation=false the bounds is drawn without concern for the size of children.
         */
        _calculateBounds() {
            if (this.hasCollapseTransformation) {
                super._calculateBounds();
            } else {
                this.compositionMask._calculateBounds();
                this._bounds = this.compositionMask._bounds.clone();
            }
        }

        /**
         * The the bound of an object without any transform applied.
         * Ex: A 100px wide square with a scale of .5 is reported to be 50px wide by getLocalBounds.
         *     This would report a width of 100px.
         * Limit the bounds of the Container to that of the set composition size (via the mask),
         * unless hasCollapseTransformation is true
         * This would mean if hasCollapseTransformation=false the bounds is drawn without concern for the size of children.
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
         * Creates a composition mask as a Sprite object. Used as a Sprite mask.
         * We have to use a sprite as a mask because you can't mix Stencil and Sprite masks.
         * @return     {PIXI.Sprite}
         */
        createSpriteCompositionMask() {
            // Create a fake texture that represents the mask.
            const canvas = document.createElement('canvas');
            canvas.width = this.compositionBounds.width;
            canvas.height = this.compositionBounds.height;
            const context = canvas.getContext('2d');
            context.fillStyle = 'white';
            context.fillRect(0, 0, this.compositionBounds.width, this.compositionBounds.height);
            // TODO: Ensure sure old Textures get blown away when we're done with them
            const texture = new pixiNamespace.Texture(
                new pixiNamespace.BaseTexture(new pixiNamespace.resources.CanvasResource(canvas)),
            );

            // Other option to use a pre-created, small texture and resize the Sprite
            // However because we link the transforms, resizing the Sprite is tricky.
            // const texture = pixiNamespace.Texture.WHITE.clone()
            // texture.orig.copyFrom(this.compositionBounds)
            // texture.updateUvs()

            const compositionMask = new pixiNamespace.Sprite(texture);
            // Link the transforms to the container so it follows the container
            compositionMask.transform = this.transform;
            compositionMask.renderable = false;
            return compositionMask;
        }

        /**
         * If this composition is being used as a mask, we need to use a Sprite because
         * PIXI doesn't work well with mixing Stencil and Sprite masks.
         *
         * @return     {PIXI.Graphics|PIXI.Graphics}  The mask for the composition
         */
        createCompositionMask() {
            if (this.isMask) {
                return this.createSpriteCompositionMask();
            }
            return super.createCompositionMask();
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

    CompositionContainer.mixin(compositionMixins);

    pixiNamespace.CompositionContainer = CompositionContainer;
}