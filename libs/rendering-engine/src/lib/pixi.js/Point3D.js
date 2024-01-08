/* eslint-disable func-names, no-param-reassign */
export default function enablePoint3D(pixiNamespace) {
    /**
     * The Point object represents a location in a three-dimensional coordinate system, where x represents
     * the horizontal axis, y represents the vertical axis, and z represents the depth axis
     *
     * Largely Copied from PIXI.Point
     *
     * @class
     * @memberof PIXI
     */
    class Point3D extends pixiNamespace.Point {
        /**
         * @param {number} [x=0] - position of the point on the x axis
         * @param {number} [y=0] - position of the point on the y axis
         * @param {number} [z=0] - position of the point on the z axis
         */
        constructor(x = 0, y = 0, z = 0) {
            super(x, y);
            /**
             * @member {number}
             * @default 0
             */
            this.z = z;
        }
        /**
         * Creates a clone of this point
         *
         * @return {PIXI.Point3D} a copy of the point
         */
        clone() {
            return new Point3D(this.x, this.y, this.z);
        }
        /**
         * Copies x and y from the given point
         *
         * @param {PIXI.IPoint3D} p - The point to copy from
         * @returns {PIXI.IPoint3D} Returns itself.
         */
        copyFrom(p) {
            this.set(p.x, p.y, p.z);
            return this;
        }
        /**
         * Copies x and y into the given point
         *
         * @param {PIXI.IPoint3D} p - The point to copy.
         * @returns {PIXI.IPoint3D} Given point with values updated
         */
        copyTo(p) {
            p.set(this.x, this.y, this.z);
            return p;
        }
        /**
         * Returns true if the given point is equal to this point
         *
         * @param {PIXI.IPoint3D} p - The point to check
         * @returns {boolean} Whether the given point equal to this point
         */
        equals(p) {
            return super.equals(p) && p.z === this.z;
        }
        /**
         * Sets the point to a new x and y position.
         * If y is omitted, both x and y and z will be set to x.
         *
         * @param {number} [x=0] - position of the point on the x axis
         * @param {number} [y=0] - position of the point on the y axis
         * @param {number} [z=0] - position of the point on the z axis
         */
        set(x, y, z) {
            super.set(x, y);
            this.z = z || (z !== 0 ? this.x : 0);
        }
    }

    pixiNamespace.Point3D = Point3D;
}