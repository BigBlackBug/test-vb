/* eslint-disable no-param-reassign, func-names, no-underscore-dangle */
import _ from 'lodash';
import TrimPath from './TrimPath.js';

export default function enableGraphicsProperties(pixiNamespace) {
    /**
     * Draws a bezier curve on a graphics object
     *
     * @param      {PIXI.Graphics}  graphicsObject  The graphics object
     * @param      {BezierJS.Bezier}  bezierCurve     The bezier js Bezier object
     */
    const drawBezierCurve = (graphicsObject, bezierCurve) => {
        const [
            /* eslint-disable-next-line no-unused-vars */
            startingVertex,
            startingControlPoint,
            destinationControlPoint,
            destinationVertex,
        ] = bezierCurve.points;
        graphicsObject.bezierCurveTo(
            // The X & Y of the first control point
            startingControlPoint.x,
            startingControlPoint.y,
            // The X & Y of the second control point
            destinationControlPoint.x,
            destinationControlPoint.y,
            // The X & Y of the destination vertex
            destinationVertex.x,
            destinationVertex.y,
        );
    };

    Object.defineProperty(pixiNamespace.Graphics.prototype, 'trimPath', {
        get: function get() {
            if (!this._trimPath) {
                this.trimPath = new TrimPath();
            }
            return this._trimPath;
        },
        set: function set(value) {
            this._trimPath = value;
        },
    });

    /**
     * Takes an array of PolyBeziers and returns an array of PolyBeziers to draw, split and grouped
     * according to the TrimPath of the Graphic object and its parents' TrimPath
     *
     * @param      {bezierjs.PolyBezier[]}  polyBeziers  And array of PolyBezier
     * @return     {bezierjs.PolyBezier[]}              The PolyBezier to draw
     */
    pixiNamespace.Graphics.prototype.getPathSegmentsToDraw = function(polyBeziers) {
        // Loop through the array of PolyBeziers and split them according to the TrimPath
        const pathSegments = _.flatten(
            polyBeziers.map((pathSegment) => {
                const splitStart = this.trimPath.start + (Math.abs(this.trimPath.offset) % 1);
                const splitEnd = this.trimPath.end + (Math.abs(this.trimPath.offset) % 1);

                /**
                 * For splits that look like:
                 * Occurs when it is not trimmed at all
                 *  S          E
                 * [============]
                 *
                 * or
                 *  E          S
                 * [============]
                 */
                if (
                    (this.trimPath.start === 0 && this.trimPath.end === 1) ||
                    (this.trimPath.end === 0 && this.trimPath.start === 1)
                ) {
                    return [pathSegment];
                }

                // We don't want the segment value to go over 1 in our split
                const bezierPathsToDraw = pathSegment.splitAtLengthSegment(splitStart % 1, splitEnd % 1);

                /**
                 * For splits that look like:
                 * Occurs when the Start is equal to the End (Normal behavior)
                 *  SE
                 * [           ]
                 *
                 */
                if (this.trimPath.start === this.trimPath.end) {
                    return [];
                    /**
                     * For splits that look like:
                     * Occurs when the Start is less than the End (Normal behavior)
                     *     S   E
                     * [   |===|   ]
                     *
                     * Occurs when the End is less than the start (but hasn't wrapped around with an offset)
                     *     E   S
                     * [   |===|   ]
                     */
                } else if (
                    (splitStart % 1 < splitEnd % 1 && splitStart < splitEnd) ||
                    (splitStart % 1 > splitEnd % 1 && splitStart > splitEnd)
                ) {
                    return [bezierPathsToDraw.middle];
                }
                /**
                 * For splits that look like:
                 * Occurs when the Start has wrapped around ahead of the end (due to an offset)
                 *     S   E
                 * [===|   |===]
                 *
                 * Or when the end has wrapped around and the start is behind (due to an offset)
                 *     E   S
                 * [===|   |===]
                 */
                return [bezierPathsToDraw.left, bezierPathsToDraw.right];
            }),
        );

        // Based on the split path segments, apply additional parent trim paths if there are any
        if (this.parent && this.parent.trimPath) {
            return this.parent.getPathSegmentsToDraw(pathSegments);
        }

        return pathSegments;
    };

    /**
     * Draws the bezier path stored in the pathBezierCurves property on the specified graphicsObject
     *
     * @param      {PIXI.Graphics}  graphicsObject  The graphics object to draw the path on (normally, this)
     */
    pixiNamespace.Graphics.prototype.drawPath = function(graphicsObject = this) {
        if (!this.pathBezierCurves) {
            return;
        }

        const pathSegments = this.getPathSegmentsToDraw([this.pathBezierCurves]).reverse();

        pathSegments.forEach((polyBezierCurve, index, curves) => {
            const firstPoint = polyBezierCurve.curve(0).point(0);
            if (index === 0) {
                graphicsObject.moveTo(firstPoint.x, firstPoint.y);
            } else {
                const lastCurve = curves[index - 1];
                const lastPoint = lastCurve.curve(lastCurve.curves.length - 1).points[3];
                // If the last curve does not end where this one starts, move the drawing operation to the new starting point
                if (!_.isEqual(firstPoint, lastPoint)) {
                    graphicsObject.moveTo(firstPoint.x, firstPoint.y);
                }
            }
            polyBezierCurve.curves.forEach((curve) => {
                drawBezierCurve(graphicsObject, curve);
            });
        });

        // Close the path if there's only one and it ends
        if (
            pathSegments.length === 1 &&
            pathSegments[0].isClosed &&
            this.trimPath.start === 0 &&
            this.trimPath.end === 1
        ) {
            graphicsObject.closePath();
        }
    };

    /**
     * Generate a gradient texture for use by a Graphic
     *
     * @param      {GradientFillStyle}  gradientFillStyle  The gradient fill style
     * @param      {PIXI.Rectangle}  bounds             The bounds
     * @param      {PIXI.Point}  center          The center of the effect
     * @return     {PIXI.Texture}
     */
    pixiNamespace.Graphics.prototype.generateGradientFillTexture = function(
        gradientFillStyle,
        bounds,
        center,
    ) {
        const {
            x: graphicsX,
            y: graphicsY,
            width,
            height
        } = bounds;
        if (!this.gradientCanvas) {
            this.gradientCanvas = document.createElement('canvas');
        }
        const gradientCanvasContext = this.gradientCanvas.getContext('2d');

        this.gradientCanvas.width = width;
        this.gradientCanvas.height = height;

        const colorStopsArray = gradientFillStyle.parseStopProperties();

        const {
            type,
            startPoint,
            endPoint,
            highlightLength,
            highlightAngle
        } = gradientFillStyle;

        const transform = new pixiNamespace.Matrix();
        transform.translate(center.x - graphicsX, center.y - graphicsY);

        const transformedStartPoint = transform.apply(startPoint);
        const transformedEndPoint = transform.apply(endPoint);

        let gradient;
        if (type === gradientFillStyle.constructor.FILL_TYPE.radial) {
            // The radial gradient is always a circle with a radius the size of the
            // end - start points
            const outerRadius = Math.hypot(
                Math.abs(transformedEndPoint.x - transformedStartPoint.x),
                Math.abs(transformedEndPoint.y - transformedStartPoint.y),
            );

            // Calculate the axis the graphic is made on
            const angleShift = Math.atan(
                (transformedEndPoint.y - transformedStartPoint.y) /
                (transformedEndPoint.x - transformedStartPoint.x),
            );

            // We get the highlight as a percentage of the radius.
            // We have to cap it before 100%/-100% because the canvas gradient drawing doesn't like
            // it if a gradient starts exactly on the outer circle.
            const highlightDistance = outerRadius * Math.max(Math.min(highlightLength, 0.999), -0.999);

            gradient = gradientCanvasContext.createRadialGradient(
                // If the highlightDistance != 0, it's shifted out by the highlightDistance
                // Convert the angle + distance to cartesian coords
                transformedStartPoint.x + Math.cos(angleShift + highlightAngle) * highlightDistance,
                transformedStartPoint.y + Math.sin(angleShift + highlightAngle) * highlightDistance,
                0,
                transformedStartPoint.x,
                transformedStartPoint.y,
                outerRadius,
            );
            // Otherwise it's linear
        } else {
            gradient = gradientCanvasContext.createLinearGradient(
                transformedStartPoint.x,
                transformedStartPoint.y,
                transformedEndPoint.x,
                transformedEndPoint.y,
            );
        }

        colorStopsArray.forEach(([position, red, green, blue, alpha]) => {
            const color = `rgba(${Math.round(red * 255)}, ${Math.round(green * 255)}, ${Math.round(
        blue * 255,
      )}, ${alpha})`;
            gradient.addColorStop(position, color);
        });

        gradientCanvasContext.clearRect(0, 0, width, height);
        gradientCanvasContext.fillStyle = gradient;
        gradientCanvasContext.fillRect(0, 0, width, height);

        if (!this.gradientCanvasTexture) {
            this.gradientCanvasTexture = pixiNamespace.Texture.from(this.gradientCanvas);
        } else {
            this.gradientCanvasTexture.update();
        }

        return this.gradientCanvasTexture;
    };

    const getChildBounds = (graphics) => {
        const bounds = graphics.geometry.bounds.clone();
        graphics.children.forEach((child) => {
            const {
                minX: x0,
                maxX: x1,
                minY: y0,
                maxY: y1
            } = getChildBounds(child);
            bounds.addFrameMatrix(child.localTransform, x0, y0, x1, y1);
        });

        return bounds;
    };

    /**
     * The the bound of an object without any transform applied.
     * Ex: A 100px wide square with a scale of .5 is reported to be 50px wide by getLocalBounds.
     *     This would report a width of 100px.
     *
     * @param      {PIXI.Rectangle}  rectangle  An optional rectangle to copy the bounds to
     * @return     {PIXI.Rectangle}  The true bounds.
     */
    // eslint-disable-next-line no-param-reassign
    pixiNamespace.Graphics.prototype.getTrueBounds = function(rectangle) {
        const bounds = new pixiNamespace.Bounds();
        if (this.visible && this.renderable) {
            this.finishPoly();
            bounds.addBounds(getChildBounds(this));
        }

        // If we passed a retangle, copy the bounds to this retangle
        if (rectangle) {
            rectangle.copyFrom(bounds.getRectangle());
            return rectangle;
        }

        return bounds.getRectangle();
    };
}