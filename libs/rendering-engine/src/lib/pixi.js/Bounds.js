/* eslint-disable no-param-reassign, func-names */

export default function enableBoundsProperties(pixiNamespace) {
    /**
     * Convienence method for determining if a passed Bounds is contained by this Bounds
     * ex: Does a rectangle from 0,0 => 400,400 contain a rectangle from 20,20, => 300,300 (Yes)
     *
     * @param      {PIXI.Bounds}  Bounds  The Bounds
     * @return     {Boolean}
     */
    pixiNamespace.Bounds.prototype.doesContain = function(bounds) {
        return (
            bounds.minX >= this.minX &&
            bounds.minY >= this.minY &&
            bounds.maxX <= this.maxX &&
            bounds.maxY <= this.maxY
        );
    };

    /**
     * Creates a new instance of the object with same properties than original.
     *
     * @return     {PIXI.Bounds}  Copy of this object.
     */
    pixiNamespace.Bounds.prototype.clone = function() {
        const bounds = new pixiNamespace.Bounds();
        bounds.minX = this.minX;
        bounds.minY = this.minY;
        bounds.maxX = this.maxX;
        bounds.maxY = this.maxY;

        return bounds;
    };
}