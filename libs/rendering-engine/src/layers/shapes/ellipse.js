/* eslint-disable func-names, no-param-reassign, no-underscore-dangle */
import {
    Point,
    Rectangle
} from 'pixi.js';
import {
    Timeline
} from '../../timeline/index.js';
import {
    applyTween
} from '../../manifest/index.js';

/**
 * The EllipseStyle property, which stores and controls the center, xRadius, and
 * yRadius values of a Ellipse
 *
 * TODO: Maybe base this off of PixiJS' Rectangle
 *
 * @class      EllipseStyle (name)
 */
class EllipseStyle {
    /**
     * Constructs the object.
     *
     * @param      {pixijs.Point}  center   The center
     * @param      {pixijs.Point}  radius     The radial axes of the ellipse
     */
    constructor(center, radius) {
        if (!center) {
            this.center = new Point();
        } else {
            this.center = center;
        }

        if (!radius) {
            this.radius = new Point();
        } else {
            this.radius = radius;
        }
    }

    get center() {
        return this._center;
    }
    set center(value) {
        this._center = value;
    }

    get radius() {
        return this._radius;
    }
    set radius(value) {
        this._radius = value;
    }

    getBounds() {
        return new Rectangle(
            this.center.x - this.radius,
            this.center.y - this.radius,
            this.radius * 2,
            this.radius * 2,
        );
    }
}

/**
 * Applies properties about this graphic object's shape based on a bodymovin export
 * @param      {pixijs.Graphics}    graphicsObject  The graphics object to act on
 * @param      {object}             shapeData       The data from bodymovin
 * @param      {Timeline}  timeline        The timeline
 * @param      {Number}             duration        The duration of the graphic on the layer
 */
export default function applyEllipsePropertiesFromBodymovin(graphicsObject, shapeData, timeline) {
    const ellipseStyle = new EllipseStyle();
    graphicsObject.drawingStyle = ellipseStyle;
    ellipseStyle.timeline = new Timeline({
        target: ellipseStyle
    });
    timeline.addTimeline(ellipseStyle.timeline, 0);

    // The center of the Ellipse
    if (shapeData.p) {
        const initialPositionData = shapeData.p.a ? shapeData.p.k[0].s : shapeData.p.k;
        [ellipseStyle.center.x, ellipseStyle.center.y] = initialPositionData;

        if (shapeData.p.a) {
            applyTween(['center.x', 'center.y'], shapeData.p, ellipseStyle.timeline);
        }
    }

    // The radius of the Ellipse
    if (shapeData.s) {
        const initialSizeData = shapeData.s.a ? shapeData.s.k[0].s : shapeData.s.k;
        // Pixi wants this as radius, but bodymovin provides the diameter
        ellipseStyle.radius.x = initialSizeData[0] / 2;
        ellipseStyle.radius.y = initialSizeData[1] / 2;

        if (shapeData.s.a) {
            applyTween(
                ['radius.x', 'radius.y'],
                shapeData.s,
                ellipseStyle.timeline,
                (value) => value / 2,
            );
        }
    }

    const drawEllipseFromProperties = () => {
        graphicsObject.drawEllipse(
            ellipseStyle.center.x,
            ellipseStyle.center.y,
            ellipseStyle.radius.x,
            ellipseStyle.radius.y,
        );
    };

    // Return an update callback that will redraw the ellipse.
    return {
        callback: drawEllipseFromProperties,
        isAnimated: Boolean(shapeData.p.a || shapeData.s.a),
    };
}