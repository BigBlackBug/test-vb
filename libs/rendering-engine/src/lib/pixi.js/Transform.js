/* eslint-disable no-param-reassign, func-names, no-underscore-dangle */

export default function enableTransformProperties(pixiNamespace) {
    /**
     * Creates a new instance of the object with same properties than original.
     */
    pixiNamespace.Transform.prototype.clone = function() {
        const clone = new pixiNamespace.Transform();
        clone.worldTransform.copyFrom(this.worldTransform);
        clone.localTransform.copyFrom(this.localTransform);
        clone.position.copyFrom(this.position);
        clone.scale.copyFrom(this.scale);
        clone.pivot.copyFrom(this.pivot);
        clone.skew.copyFrom(this.skew);
        clone.rotation = this.rotation;

        return clone;
    };
}