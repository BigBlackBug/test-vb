/* eslint-disable no-param-reassign, func-names */

export default function enableDisplayObjectProperties(pixiNamespace) {
    /**
     * Helper method to add the passed filter to the display object without removing other filters
     *
     * @param      {pixijs.DisplayObject}  displayObject  The display object
     * @param      {pixijs.Filter[]}       filtersToAdd   The filters
     */
    pixiNamespace.DisplayObject.prototype.addFilters = function(...filters) {
        if (!Array.isArray(this.filters)) {
            this.filters = [];
        }

        filters.forEach((filter) => {
            // Only add filter if it's not already in the array
            // NOTE: I can't currently imagine a use case where we want to layer the same
            // filter more than once, but if it ever comes up, this needs to be changed.
            if (!this.filters.includes(filter)) {
                this.filters.push(filter);
            }
        });
    };

    /**
     * Performs a function on all parents. The closest parent is called first
     *
     * @param      {function}  callback  the function to call on each parent
     */
    /* eslint-disable-next-line func-names, no-param-reassign */
    pixiNamespace.DisplayObject.prototype.forEachParent = function(callback) {
        if (this.parent) {
            callback(this.parent);
            this.parent.forEachParent(callback);
        }
    };

    /**
     * Calls the callback function on an object and the object's parent (and its
     * parent, etc.)
     *
     * @param      {Function}  callback  The callback (passed the current object and the current value)
     * @param      {*}    initialValue  The initial value
     */
    pixiNamespace.DisplayObject.prototype.reduceParent = function(callback, initialValue) {
        if (this.parent) {
            initialValue = this.parent.reduceParent(callback, initialValue);
        }

        return callback(initialValue, this);
    };

    /**
     * Gets the most root parent (the highest-order object without a parent)
     */
    /* eslint-disable-next-line func-names, no-param-reassign */
    pixiNamespace.DisplayObject.prototype.getRootParent = function() {
        if (this.parent) {
            return this.parent.getRootParent();
        }

        return this;
    };

    /**
     * The the bound of an object without any transform applied, as if it was in a space without a parent
     * or transforms.
     * Ex: A 100px wide square with a scale of .5 is reported to be 50px wide by getLocalBounds.
     *     This would report a width of 100px.
     *
     * Note: Other sub classes of DisplayObject has their own implementation of getTrueBounds
     *       We can't use getBounds in every instance because there is still some instances where
     *       bounds is based on a transform of some kind and would fail when scale = 0.
     *
     * @param      {PIXI.Rectangle}  rectangle  An optional rectangle to copy the bounds to
     * @return     {PIXI.Rectangle}  The true bounds.
     */
    pixiNamespace.DisplayObject.prototype.getTrueBounds = function(rectangle) {
        // Get the world bounds of the object
        const bounds = this.getBounds(false, rectangle);
        // Invert the world transform and transform the rectangle to get the bounds untransformed
        bounds.transformRectangle(this.worldTransform.clone().invert());

        // If we passed a retangle, copy the bounds to this retangle
        if (rectangle) {
            rectangle.copyFrom(bounds);
            return rectangle;
        }

        return bounds;
    };
}