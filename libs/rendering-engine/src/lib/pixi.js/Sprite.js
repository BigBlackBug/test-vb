/* eslint-disable func-names, no-underscore-dangle */
export default function enableSpriteProperties(pixiNamespace) {
    const Bounds = pixiNamespace.Bounds;
    const Rectangle = pixiNamespace.Rectangle;

    /**
     * Gets the local bounds of the sprite object.
     *
     * @param {PIXI.Rectangle} [rect] - The output rectangle.
     * @return {PIXI.Rectangle} The bounds.
     */
    // eslint-disable-next-line no-param-reassign
    // @dangerousMonkeyPatch
    pixiNamespace.Sprite.prototype.getLocalBounds = function(rect) {
        // we can do a fast local bounds if the sprite has no children!
        if (
            this.children.length === 0 ||
            // WM: Begin monkeypatch
            (this.children.length === 2 && this.mediaRedraw && this.backgroundFill)
            // WM: End monkeypatch
        ) {
            if (!this._localBounds) {
                this._localBounds = new Bounds();
            }
            this._localBounds.minX = this._texture.orig.width * -this._anchor._x;
            this._localBounds.minY = this._texture.orig.height * -this._anchor._y;
            this._localBounds.maxX = this._texture.orig.width * (1 - this._anchor._x);
            this._localBounds.maxY = this._texture.orig.height * (1 - this._anchor._y);
            if (!rect) {
                if (!this._localBoundsRect) {
                    this._localBoundsRect = new Rectangle();
                }
                rect = this._localBoundsRect;
            }
            return this._localBounds.getRectangle(rect);
        }
        return pixiNamespace.Container.prototype.getLocalBounds.call(this, rect);
    };

    /**
     * The the bound of an object without any transform applied.
     * Ex: A 100px wide square with a scale of .5 is reported to be 50px wide by getLocalBounds.
     *     This would report a width of 100px.
     * NOTE: This has to go AFTER the getLocalBounds definition because it will be referencing the old one.
     *
     * @param      {PIXI.Rectangle}  rectangle  An optional rectangle to copy the bounds to
     * @return     {PIXI.Rectangle}  The true bounds.
     */
    // eslint-disable-next-line no-param-reassign
    pixiNamespace.Sprite.prototype.getTrueBounds = pixiNamespace.Sprite.prototype.getLocalBounds;
}