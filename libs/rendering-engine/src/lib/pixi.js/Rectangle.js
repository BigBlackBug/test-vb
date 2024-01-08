/* eslint-disable func-names, no-param-reassign */
export default function enableRectangleProperties(pixiNamespace) {
    /**
     * Transforms this rectangle given a passed transform matrix.
     * Stolen mostly from PIXI.Bounds `addFrame`` method
     *
     * @param      {PIXI.Matrix}  transform  The transform matrix
     */
    pixiNamespace.Rectangle.prototype.transformRectangle = function(matrix) {
        const {
            a,
            b,
            c,
            d,
            tx,
            ty
        } = matrix;

        const x1 = this.x + this.width;
        const y1 = this.y + this.height;

        // top left point
        const topLeftX = a * this.x + c * this.y + tx;
        const topLeftY = b * this.x + d * this.y + ty;

        // top right point
        const topRightX = a * x1 + c * this.y + tx;
        const topRightY = b * x1 + d * this.y + ty;

        // bottom left point
        const bottomLeftX = a * this.x + c * y1 + tx;
        const bottomLeftY = b * this.x + d * y1 + ty;

        // bottom right point
        const bottomRightX = a * x1 + c * y1 + tx;
        const bottomRightY = b * x1 + d * y1 + ty;

        this.x = Math.min(topLeftX, topRightX, bottomLeftX, bottomRightX);
        const maxX = Math.max(topLeftX, topRightX, bottomLeftX, bottomRightX);
        this.y = Math.min(topLeftY, topRightY, bottomLeftY, bottomRightY);
        const maxY = Math.max(topLeftY, topRightY, bottomLeftY, bottomRightY);
        this.width = maxX - this.x;
        this.height = maxY - this.y;
    };
}