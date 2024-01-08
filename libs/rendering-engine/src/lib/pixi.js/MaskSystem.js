import {
    trackMatteTypes
} from '../../layers/index.js';

/* eslint-disable func-names, no-param-reassign */
export default function enableMaskSystemProperties(pixiNamespace) {
    /**
     * Ignore Alpha filters when adding masks
     * (as they will be applied to the entire area of the composition and change the masking size)
     *
     * @param      {PIXI.DisplayObject}            displayObject  The display object
     * @return     {PIXI.AlphaFilter[]}  An array of AlphaFilters we disabled
     */
    const disableAlphaFilters = (displayObject) => {
        const disabledFilters = [];
        // Only do it on compositions (until I can find a use case where we need to do it on all of them)
        if (
            [pixiNamespace.CompositionContainer, pixiNamespace.CompositionGraphics].includes(
                displayObject.constructor,
            )
        ) {
            (displayObject.filters || []).forEach((filter) => {
                // Only disable enabled ones (so we can return just the ones we disabled)
                if (filter instanceof pixiNamespace.filters.AlphaFilter && filter.enabled) {
                    filter.enabled = false;
                    disabledFilters.push(filter);
                }
            });
        }

        // Perform this on children so they don't interfer as well
        if (displayObject.children) {
            displayObject.children.forEach((child) => {
                // TODO: This is clearly not doing what is intended (we don't reasign disabledFilters), however, removing this breaks everything.
                disabledFilters.concat(disableAlphaFilters(child));
            });
        }

        return disabledFilters;
    };

    pixiNamespace.systems.MaskSystem.prototype.processMaskOperations = function(
        target,
        maskData,
        maskOperation,
    ) {
        let disabledFilters = disableAlphaFilters(maskData);
        // If the target is a composition and has a mask, we also need to disable the target's filters
        if (
            [pixiNamespace.CompositionContainer, pixiNamespace.CompositionGraphics].includes(
                target.constructor,
            ) &&
            target.compositionMask &&
            target.compositionMask !== maskData
        ) {
            disabledFilters = disabledFilters.concat(disableAlphaFilters(target));
        }
        // If the mask has a compositionMask itself, apply that to the object.
        if (maskData.compositionMask) {
            maskOperation.call(this, target, maskData.compositionMask);
        }

        let shouldUseCompositionMask = true;
        // We'll test to see if the mask is contained by the composition mask. If it is, we don't need to use the composition mask.
        if (target.compositionMask && target.compositionMask !== maskData) {
            const compositionMaskBounds = new pixiNamespace.Bounds();
            const {
                x,
                y,
                width,
                height
            } = target.compositionBounds;
            compositionMaskBounds.addFrame(target.compositionMask.transform, x, y, x + width, y + height);

            // eslint-disable-next-line no-underscore-dangle
            shouldUseCompositionMask = !compositionMaskBounds.doesContain(maskData._bounds);
        }

        // Apply the target's own composition mask (unless it's the only mask to apply)
        if (
            target.compositionMask &&
            target.compositionMask !== maskData &&
            !target.hasCollapseTransformation &&
            shouldUseCompositionMask
        ) {
            maskOperation.call(this, target, target.compositionMask);
        }

        // If the mask is just a CompositionContainer (not CompositionGraphics) we need to cache the container
        // TODO: A potential future optimization is to only cache it if there are graphics as children.
        //       We can apply a bunch of Sprite layers as individual Sprite masks without caching, but we can't mix
        //       Stencil and Sprite masks.
        if (maskData instanceof pixiNamespace.CompositionContainer) {
            // If there's a cached mask, we're popping, so call the operation and remove the sprite
            if (maskData.cachedMaskSprite) {
                maskOperation.call(this, target, maskData.cachedMaskSprite);
                maskData.cachedMaskSprite = null;
                // If there isn't a cached mask, generate one
            } else {
                maskData.renderable = true;
                const texture = this.renderer.generateTexture(
                    maskData,
                    pixiNamespace.SCALE_MODES.NEAREST,
                    1,
                    maskData.compositionBounds,
                );
                maskData.renderable = false;
                const mask = new pixiNamespace.Sprite(texture);
                maskData.cachedMaskSprite = mask;

                maskOperation.call(this, target, maskData.cachedMaskSprite);
            }
            // Otherwise, continue on as normal
        } else {
            maskOperation.call(this, target, maskData);
        }

        disabledFilters.forEach((filter) => {
            filter.enabled = true;
        });
    };

    const originalPush = pixiNamespace.systems.MaskSystem.prototype.push;

    // Augments the current push method to allow for Mattes with composition masks to work
    // @dangerousMonkeyPatch
    pixiNamespace.systems.MaskSystem.prototype.push = function(target, maskData) {
        this.processMaskOperations(target, maskData, originalPush);
    };

    const originalPop = pixiNamespace.systems.MaskSystem.prototype.pop;
    // Augments the current pop method to allow for Mattes with composition masks to work
    // @dangerousMonkeyPatch
    pixiNamespace.systems.MaskSystem.prototype.pop = function(target) {
        // eslint-disable-next-line no-underscore-dangle
        this.processMaskOperations(target, target._mask, originalPop);
    };

    /**
     * Applies the Mask and adds it to the current filter stack.
     * This method is a direct copy of MaskSystem.pushSpriteMask except for using
     * our own custom AlphaSpriteMaskFilter
     *
     * @param {PIXI.RenderTexture} target - Display Object to push the sprite mask to
     * @param {PIXI.Sprite} maskData - Sprite to be used as the mask
     */
    // @dangerousMonkeyPatch
    pixiNamespace.systems.MaskSystem.prototype.pushSpriteMask = function(maskData) {
        const {
            maskObject
        } = maskData;
        const target = maskData._target;
        let alphaMaskFilter = maskData._filters;

        if (!alphaMaskFilter) {
            // WM: Begin monkeypatch
            // TODO: We may be able to remove this monkeypatch and taken advantage of the
            // new ability to pass in custom sprite mask filters https://github.com/pixijs/pixijs/pull/7648
            let filterType;
            // Use the AlphaSpriteMaskFilter for alpha track mattes
            if ([trackMatteTypes.alpha, trackMatteTypes.alphaInverted].includes(target.trackMatteType)) {
                filterType = pixiNamespace.AlphaSpriteMaskFilter;
            } else {
                filterType = pixiNamespace.SpriteMaskFilter;
            }
            alphaMaskFilter = this.alphaMaskPool[this.alphaMaskIndex] = [new filterType(maskObject)];
            // WM: End monkeypatch
        }

        const renderer = this.renderer;
        const renderTextureSystem = renderer.renderTexture;

        let resolution;
        let multisample;

        if (renderTextureSystem.current) {
            const renderTexture = renderTextureSystem.current;

            resolution = maskData.resolution || renderTexture.resolution;
            multisample = maskData.multisample ? ? renderTexture.multisample;
        } else {
            resolution = maskData.resolution || renderer.resolution;
            multisample = maskData.multisample ? ? renderer.multisample;
        }

        alphaMaskFilter[0].resolution = resolution;
        alphaMaskFilter[0].multisample = multisample;
        alphaMaskFilter[0].maskSprite = maskObject;

        const stashFilterArea = target.filterArea;

        target.filterArea = maskObject.getBounds(true);
        renderer.filter.push(target, alphaMaskFilter);
        target.filterArea = stashFilterArea;

        if (!maskData._filters) {
            this.alphaMaskIndex++;
        }
    };
}