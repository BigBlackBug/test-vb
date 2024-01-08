/* eslint-disable no-param-reassign, func-names, no-underscore-dangle */
/**
 * Enables the custom ParentTransform property and methods on PixiJS objects.
 *
 * @param      {object}  pixiNamespace  The pixi namespace
 */
export default function enableLinkedParentProperties(pixiNamespace) {
    // Allow the `pixiNamespace` parameter to be modified.

    /**
     * Update the original object's transform by combining it with the parentObject transform
     *
     * @param      {pixijs.DisplayObject}  originalObject  The original object
     * @param      {pixijs.DisplayObject}  parentObject    The parent object
     */
    function updateLinkedParent(originalObject, parentObject) {
        // If the parent object has its own transform parent, transform that too.
        if (parentObject.waymarkLinkedParent && parentObject.waymarkLinkedParent !== parentObject) {
            updateLinkedParent(originalObject, parentObject.waymarkLinkedParent);
        }

        // Make sure the parent object has been updated first
        parentObject.updateTransform();

        /**
         * Always force an update by resetting the _parentID:
         * Normally in PIXI, an object only has one parent and it caches a copy of its parent’s _worldID
         * to not re-transform things multiple times, but given that our object now can have multiple
         * linked “parent” transforms on each object we are don't want any parent ids to accidentally
         * be the same, which would cause the update world transform not to work correctly.
         */
        originalObject.transform._parentID = -1;
        // Update the original object's transform with the parent now!
        originalObject.transform.updateTransform(parentObject.transform);
    }

    pixiNamespace.DisplayObject.prototype.setLinkedParent = function(transformParent) {
        this.waymarkLinkedParent = transformParent;
        // Update the transform so we have an up-to-date transform
        this.updateTransform();
    };

    /**
     * Modifies _recursivePostUpdateTransform to support `waymarkLinkedParent`. There is no
     * easy hook, so this is unfortunately largely a copy-and-paste. If a Pixi.js update
     * modifies `DisplayObject.prototype._recursivePostUpdateTransform` we'd need to update
     * this method.
     */
    // @dangerousMonkeyPatch
    pixiNamespace.DisplayObject.prototype._recursivePostUpdateTransform = function() {
        if (this.parent) {
            this.parent._recursivePostUpdateTransform();
            this.transform.updateTransform(this.parent.transform);
            // WM: Begin monkeypatch
            if (this.waymarkLinkedParent) {
                this.transform._parentID = -1;
                this.transform.updateTransform(this.waymarkLinkedParent.transform);
            }
            // WM: End monkeypatch
        } else {
            this.transform.updateTransform(this._tempDisplayObjectParent.transform);
        }
    };

    /**
     * Updates the object transform for rendering
     * This method is overwriting the existing updateTransform method to
     * include our transformParent and is mostly copied PixiJS Code
     */
    // @dangerousMonkeyPatch
    pixiNamespace.DisplayObject.prototype.updateTransform = function() {
        /* eslint-disable-next-line no-underscore-dangle */
        this._boundsID++;

        // WM: Begin monkeypatch
        // NOTE: this.parent check does not exist in Pixi.  Why do we need this?  Are we call it in a way that Pixi doesn't?
        // https://github.com/stikdev/waymark/commit/62df420997362cce5d3e1a756a6fe343dfe7efea
        if (this.parent) {
            // WM: End monkeypatch
            this.transform.updateTransform(this.parent.transform);
            // multiply the alphas..
            this.worldAlpha = this.alpha * this.parent.worldAlpha;
        }

        // WM: Begin monkeypatch
        if (this.waymarkLinkedParent && this.waymarkLinkedParent !== this) {
            updateLinkedParent(this, this.waymarkLinkedParent);
        }
        // WM: End monkeypatch
    };

    // @dangerousMonkeyPatch
    // This is simply using our new updateTransform method
    pixiNamespace.DisplayObject.prototype.displayObjectUpdateTransform =
        pixiNamespace.DisplayObject.prototype.updateTransform;

    /**
     * Updates the transform on all children of this container for rendering
     * This method is overwriting the existing updateTransform method to
     * include our transformParent and is mostly copied PixiJS Code
     */
    // @dangerousMonkeyPatch
    pixiNamespace.Container.prototype.updateTransform = function() {
        if (this.sortableChildren && this.sortDirty) {
            this.sortChildren();
        }

        this._boundsID++;

        // WM: Begin monkeypatch
        // NOTE: this.parent check does not exist in Pixi.  Why do we need this?  Are we call it in a way that Pixi doesn't?
        // https://github.com/stikdev/waymark/commit/62df420997362cce5d3e1a756a6fe343dfe7efea
        if (this.parent) {
            // WM: End monkeypatch
            this.transform.updateTransform(this.parent.transform);
            // TODO: check render flags, how to process stuff here
            this.worldAlpha = this.alpha * this.parent.worldAlpha;
        }

        // WM: Begin monkeypatch
        if (this.waymarkLinkedParent) {
            updateLinkedParent(this, this.waymarkLinkedParent);
        }
        // WM: End monkeypatch

        for (let i = 0, j = this.children.length; i < j; i += 1) {
            const child = this.children[i];

            if (child.visible) {
                child.updateTransform();
            }
        }
    };

    /**
     * Calls the callback function on an object's linked parent (and its linked
     * parent, etc.)
     *
     * @param      {Function}  callback  The callback (passed the current parent object)
     * @param      {*}    callbackScope  The callback scope (otherwise the child object)
     */
    pixiNamespace.DisplayObject.prototype.forEachLinkedParent = function(callback, callbackScope) {
        if (this.waymarkLinkedParent) {
            this.waymarkLinkedParent.forEachLinkedParent(callback, callbackScope);
            callback.call(callbackScope || this, this.waymarkLinkedParent);
        }
    };

    /**
     * Calls the callback function on an object and the object's linked parent (and its linked
     * parent, etc.)
     *
     * @param      {Function}  callback  The callback (passed the current object and the current value)
     * @param      {*}    initialValue  The initial value
     */
    pixiNamespace.DisplayObject.prototype.reduceLinkedParent = function(callback, initialValue) {
        if (this.waymarkLinkedParent) {
            initialValue = this.waymarkLinkedParent.reduceLinkedParent(callback, initialValue);
        }

        return callback(initialValue, this);
    };

    /**
     * Checks if a passed object is a linked parent of this object (or is a parent of this object's parent)
     *
     * @param      {PIXI.DisplayObject}  displayObject  The display object
     */
    pixiNamespace.DisplayObject.prototype.isObjectLinkedParent = function(displayObject) {
        if (this.waymarkLinkedParent === displayObject) {
            return true;
        } else if (this.waymarkLinkedParent) {
            return this.waymarkLinkedParent.isObjectLinkedParent(displayObject);
        }
        return false;
    };

    /**
     * Gets the most root parent (the highest-order object without a parent)
     */
    /* eslint-disable-next-line func-names, no-param-reassign */
    pixiNamespace.DisplayObject.prototype.getRootLinkedParent = function() {
        if (this.waymarkLinkedParent) {
            return this.waymarkLinkedParent.getRootLinkedParent();
        }

        return this;
    };

    pixiNamespace.Container.prototype.containerUpdateTransform =
        pixiNamespace.Container.prototype.updateTransform;
    pixiNamespace.Graphics.prototype.containerUpdateTransform =
        pixiNamespace.Graphics.prototype.updateTransform;
}