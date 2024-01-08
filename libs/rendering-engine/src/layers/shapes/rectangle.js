/* eslint-disable func-names, no-param-reassign */
import {
    Rectangle
} from 'pixi.js';
import {
    Timeline
} from '../../timeline/index.js';
import {
    applyTween
} from '../../manifest/index.js';
import {
    constructPolyBezierFromData
} from './path.js';

class RectangleStyle extends Rectangle {
    /**
     * Gets the rectangle verticies from our rectangleStyle object
     * NOTE: A Key difference is the the Bodymovin data assumes the rectangle is drawn from the center as opposed to the top left,
     * so we don't use the left/right/top/bottom properties
     *
     * @return     {Array}   The rectangle verticies.
     */
    getRectangleVerticies() {
        const minX = this.x - this.width / 2;
        const maxX = this.x + this.width / 2;
        const minY = this.y - this.height / 2;
        const maxY = this.y + this.height / 2;

        return [
            [maxX, minY],
            [maxX, maxY],
            [minX, maxY],
            [minX, minY],
        ];
    }

    getBounds() {
        return new Rectangle(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height,
        );
    }
}

/**
 * Applies properties about this graphic object's shape based on a bodymovin export
 *
 * @param      {pixijs.Graphics}    graphicsObject  The graphics object to act on
 * @param      {object}             shapeData  The shape data from bodymovin
 * @param      {Timeline}  timeline   The timeline
 * @param      {Number}             duration   The duration of the graphic on the layer
 */
export default function applyRectanglePropertiesFromBodymovin(graphicsObject, shapeData, timeline) {
    // Use a PixiJS Rectangle object to store our values, which will work fine for now.
    // Key difference is the the Bodymovin data assumes the rectangle is drawn from the center as opposed to the top left.
    const rectangleStyle = new RectangleStyle();
    rectangleStyle.timeline = new Timeline({
        target: rectangleStyle
    });
    timeline.addTimeline(rectangleStyle.timeline, 0);
    graphicsObject.drawingStyle = rectangleStyle;

    // The center of the rectangle
    if (shapeData.p) {
        const initialPositionData = shapeData.p.a ? shapeData.p.k[0].s : shapeData.p.k;
        [rectangleStyle.x, rectangleStyle.y] = initialPositionData;

        if (shapeData.p.a) {
            applyTween(['x', 'y'], shapeData.p, rectangleStyle.timeline);
        }
    }

    // The size of the rectangle
    if (shapeData.s) {
        const initialSizeData = shapeData.s.a ? shapeData.s.k[0].s : shapeData.s.k;
        [rectangleStyle.width, rectangleStyle.height] = initialSizeData;

        if (shapeData.s.a) {
            applyTween(['width', 'height'], shapeData.s, rectangleStyle.timeline);
        }
    }

    // Generate a PolyBezier for the rectangle
    graphicsObject.pathBezierCurves = constructPolyBezierFromData({
        v: rectangleStyle.getRectangleVerticies(), // The verticies
        i: [
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
        ], // The bezier in points (relative to the vertex)
        o: [
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
        ], // The bezier in points (relative to the destination point)
        c: true, // If the curve is closed
    });

    // The corner radius
    if (shapeData.r) {
        const initialCornerRadiusData = shapeData.r.a ? shapeData.r.k[0].s[0] : shapeData.r.k;
        // Assigning a property to the Rectangle only used here, the corner radius
        rectangleStyle.cornerRadius = initialCornerRadiusData;

        if (shapeData.r.a) {
            applyTween(['cornerRadius'], shapeData.r, rectangleStyle.timeline);
        }
    }

    /**
     * Draws a rectangle using Graphics methods from positional properties.
     */
    const drawRectangleFromProperties = (graphics) => {
        const {
            x,
            y,
            width,
            height
        } = rectangleStyle;

        // We assigned a temporary property to the Rectangle only used here, the corner radius
        if (rectangleStyle.cornerRadius) {
            // Subract .01 because Pixi renders a gap in the stroke when the radius is exactly half of the width or height
            const cornerRadius = Math.min(
                rectangleStyle.cornerRadius,
                width / 2 - 0.01,
                height / 2 - 0.01,
            );
            graphics.drawRoundedRect(x - width / 2, y - height / 2, width, height, cornerRadius);
            // If we have Trim Path data, draw the Rectangle as a path so we can use our trim path feature!
            // TODO: Draw all shapes as paths so we can use trim paths!
            // TODO: This is recreating pathBezierCurves whenever this gets called, we probably should fix that.
        } else {
            // Update the path verticies
            graphics.pathBezierCurves = constructPolyBezierFromData({
                v: rectangleStyle.getRectangleVerticies(), // The verticies
                i: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                    [0, 0],
                ], // The bezier in points (relative to the vertex)
                o: [
                    [0, 0],
                    [0, 0],
                    [0, 0],
                    [0, 0],
                ], // The bezier in points (relative to the destination point)
                c: true, // If the curve is closed
            });

            graphics.drawPath();
        }
    };

    return {
        callback: drawRectangleFromProperties,
        isAnimated: Boolean(shapeData.p.a || shapeData.s.a || shapeData.r.a),
    };
}