import _ from 'lodash';

/* eslint-disable no-underscore-dangle, func-names, no-param-reassign */
/* eslint-disable-next-line import/prefer-default-export */
/**
 * @param {object} pixiNamespace The Pixi export that we will be modifying
 */
export default function enableContainerProperties(pixiNamespace) {
    /**
     * Returns an array of display objects in the container matching the predicate
     * Inspired by: https://pixijs.download/release/docs/PIXI.Container.html#getChildByName
     *
     * Recursive searches are done in a preorder traversal.
     *
     * @function filterChildren
     * @memberof PIXI.Container#
     * @param {Function|object|Array} predicate - Expression or property to search by. Follow the lodash filter predicate
     * @param {boolean}[isDeep=false] - Whether to search recursively
     * @returns {pixiNamespace.Container[]} The an array of children matching the predicate
     */
    pixiNamespace.Container.prototype.filterChildren = function(predicate, isDeep) {
        const children = _.filter(this.children, predicate);
        if (isDeep) {
            for (let i = 0, j = this.children.length; i < j; i += 1) {
                const child = this.children[i];
                // We only need to recursively search if it's a container
                if (child.filterChildren) {
                    children.push(...child.filterChildren(predicate, true));
                }
            }
        }
        return children;
    };

    /**
     * Returns the first display object in the container matching the predicate
     * Inspired by: https://pixijs.download/release/docs/PIXI.Container.html#getChildByName
     *
     * Recursive searches are done in a preorder traversal.
     *
     * @function findChild
     * @memberof PIXI.Container#
     * @param {Function|object|Array} predicate - Expression or property to search by. Follow the lodash filter predicate
     * @param {boolean}[isDeep=false] - Whether to search recursively
     * @returns {pixiNamespace.Container} The first child matching the predicate
     */
    pixiNamespace.Container.prototype.findChild = function(predicate, isDeep) {
        let foundChild = _.find(this.children, predicate);
        if (isDeep && !foundChild) {
            for (let i = 0, j = this.children.length; i < j; i += 1) {
                const child = this.children[i];
                // We only need to recursively search if it's a container
                if (child.findChild) {
                    foundChild = child.findChild(predicate, true);
                    if (foundChild) {
                        break;
                    }
                }
            }
        }

        return foundChild;
    };

    /**
     * Performs a function on all nested children
     *
     * @param      {Function}  childFunction  the function to call on the children
     */
    pixiNamespace.Container.prototype.callAllChildren = function(childFunction) {
        this.children.forEach((child) => {
            childFunction.call(child, child);
            child.callAllChildren(childFunction);
        });
    };

    /**
     * Performs an async function on all nested children
     *
     * @param      {Function}  childFunction  the function to call on the children
     */
    pixiNamespace.Container.prototype.callAllChildrenAsync = async function(childFunction) {
        await Promise.all(
            this.children.map(async (child) => {
                await childFunction.call(child, child);
                await child.callAllChildrenAsync(childFunction);
            }),
        );
    };

    /**
     * Recalculates the bounds of the container. This is copied over from PIXI.Container,
     * with the small addition of also checking if the container is a mask itself.
     *
     * @dangerousMonkeyPatch
     */
    pixiNamespace.Container.prototype.calculateBounds = function calculateBounds() {
        this._bounds.clear();

        this._calculateBounds();

        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];

            if (!child.visible || !child.renderable) {
                continue;
            }

            child.calculateBounds();

            // TODO: filter+mask, need to mask both somehow
            if (child._mask) {
                const maskObject = child._mask.isMaskData ? child._mask.maskObject : child._mask;

                if (maskObject) {
                    maskObject.calculateBounds();
                    this._bounds.addBoundsMask(child._bounds, maskObject._bounds);
                } else {
                    this._bounds.addBounds(child._bounds);
                }
                // WM: Begin monkey patch
                // The `&& !this.isMask` is the only difference from the original PIXI.Container
            } else if (child.filterArea && !this.isMask) {
                // WM: End monkey patch
                this._bounds.addBoundsArea(child._bounds, child.filterArea);
            } else {
                this._bounds.addBounds(child._bounds);
            }
        }

        this._bounds.updateID = this._boundsID;
    };
}
/* eslint-enable no-underscore-dangle, func-names, no-param-reassign */