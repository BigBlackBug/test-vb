/* eslint-disable func-names, no-param-reassign, no-underscore-dangle */
export default function enableObservablePoint3D(pixiNamespace) {
    /**
     * The Point object represents a location in a three-dimensional coordinate system, where x represents
     * the horizontal axis, y represents the vertical axis, and z represents the depth axis
     *
     * An ObservablePoint is a point that triggers a callback when the point's position is changed.
     *
     * Largely Copied from PIXI.ObservablePoint
     *
     * @class
     * @memberof PIXI
     */
    class ObservablePoint3D extends pixiNamespace.ObservablePoint {
        /**
         * @param {Function} cb - callback when changed
         * @param {object} scope - owner of callback
         * @param {number} [x=0] - position of the point on the x axis
         * @param {number} [y=0] - position of the point on the y axis
         * @param {number} [x=0] - position of the point on the x axis
         */
        constructor(cb, scope, x = 0, y = 0, z = 0) {
            super(cb, scope, x, y);
            this._z = z;
        }
        /**
         * Creates a clone of this point.
         * The callback and scope params can be overidden otherwise they will default
         * to the clone object's values.
         *
         * @override
         * @param {Function} [cb=null] - callback when changed
         * @param {object} [scope=null] - owner of callback
         * @return {PIXI.ObservablePoint} a copy of the point
         */
        clone(cb = null, scope = null) {
            const _cb = cb || this.cb;
            const _scope = scope || this.scope;
            return new ObservablePoint3D(_cb, _scope, this._x, this._y, this._z);
        }
        /**
         * Sets the point to a new x, y, and z position.
         * If y is omitted, both x, y and z will be set to x.
         *
         * @param {number} [x=0] - position of the point on the x axis
         * @param {number} [y=0] - position of the point on the y axis
         * @param {number} [z=0] - position of the point on the z axis
         */
        set(x, y, z) {
            const _x = x || 0;
            const _y = y || (y !== 0 ? _x : 0);
            const _z = z || (z !== 0 ? _x : 0);
            if (this._x !== _x || this._y !== _y || this._z !== _z) {
                this._x = _x;
                this._y = _y;
                this._z = _z;
                this.cb.call(this.scope);
            }
        }
        /**
         * Copies x, y, and z from the given point
         *
         * @param {PIXI.IPoint} p - The point to copy from.
         * @returns {PIXI.IPoint} Returns itself.
         */
        copyFrom(p) {
            if (this._x !== p.x || this._y !== p.y || this._z !== p.z) {
                this._x = p.x;
                this._y = p.y;
                this._z = p.z;
                this.cb.call(this.scope);
            }
            return this;
        }
        /**
         * Copies x, y, and z into the given point
         *
         * @param {PIXI.IPoint} p - The point to copy.
         * @returns {PIXI.IPoint} Given point with values updated
         */
        copyTo(p) {
            p.set(this._x, this._y, this._z);
            return p;
        }
        /**
         * Returns true if the given point is equal to this point
         *
         * @param {PIXI.IPoint} p - The point to check
         * @returns {boolean} Whether the given point equal to this point
         */
        equals(p) {
            return super.equals(p) && p.z === this._z;
        }

        /**
         * The position of the displayObject on the z axis relative to the local coordinates of the parent.
         *
         * @member {number}
         */
        get z() {
            return this._z;
        }
        set z(
            value, // eslint-disable-line require-jsdoc
        ) {
            if (this._z !== value) {
                this._z = value;
                this.cb.call(this.scope);
            }
        }
    }

    pixiNamespace.ObservablePoint3D = ObservablePoint3D;
}