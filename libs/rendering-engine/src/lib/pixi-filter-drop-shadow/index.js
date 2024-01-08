/* eslint-disable func-names, no-param-reassign, no-underscore-dangle */
export default function enablePixiFilterDropShadowProperties(pixiFilterDropShadowNamespace) {
    const originalUpdatePadding =
        pixiFilterDropShadowNamespace.DropShadowFilter.prototype._updatePadding;

    pixiFilterDropShadowNamespace.DropShadowFilter.prototype._updatePadding = function() {
        // PixiJS calculates padding as (distance + (blur * 2)). This is very frequently too small.
        originalUpdatePadding.apply(this);

        // Multiplying the PixiJS-calculated padding by 2 seems to work well and doesn't interfere with
        // the display object's filterArea, which is modified for motion blur support.
        this.padding *= 2;
    };
}