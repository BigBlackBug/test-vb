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
 * The StarStyle property, which stores and controls the position, xRadius, and
 * yRadius values of a star
 *
 * @class      StarStyle (name)
 */
class StarStyle {
    /**
     * @param      {pixijs.Point}  center       The center
     * @param      {number}        points       The number of points the star has
     * @param      {number}        rotation     The rotation
     * @param      {number}        outerRadius  The outer radius
     * @param      {number}        innerRadius  The inner radius
     */
    constructor(center, points = 2, rotation = 0, outerRadius = 0, innerRadius) {
        if (!center) {
            this.center = new Point();
        } else {
            this.center = center;
        }

        this.points = points;
        this.outerRadius = outerRadius;
        this.innerRadius = innerRadius;
        this.rotation = rotation;
    }

    get center() {
        return this._center;
    }
    set center(value) {
        this._center = value;
    }

    get points() {
        return this._points;
    }
    set points(value) {
        this._points = value;
    }

    get rotation() {
        return this._rotation;
    }
    set rotation(value) {
        this._rotation = value;
    }

    get outerRadius() {
        return this._outerRadius;
    }
    set outerRadius(value) {
        this._outerRadius = value;
    }

    get innerRadius() {
        return this._innerRadius;
    }
    set innerRadius(value) {
        this._innerRadius = value;
    }

    getBounds() {
        return new Rectangle(
            this.center.x - this.outerRadius,
            this.center.y - this.outerRadius,
            this.outerRadius * 2,
            this.outerRadius * 2,
        );
    }
}

/**
 * Applies properties about this graphic object's shape based on a bodymovin export
 *
 * @param      {pixijs.Graphics}    graphicsObject  The graphics object to act on
 * @param      {object}             shapeData  The shape data from bodymovin
 * @param      {Timeline}  timeline   The timeline
 */
export default function applyStarPropertiesFromBodymovin(graphicsObject, shapeData, timeline) {
    const starStyle = new StarStyle();
    starStyle.timeline = new Timeline({
        target: starStyle
    });
    timeline.addTimeline(starStyle.timeline, 0);
    graphicsObject.drawingStyle = starStyle;

    // The center of the star
    if (shapeData.p) {
        const initialCenterData = shapeData.p.a ? shapeData.p.k[0].s : shapeData.p.k;
        starStyle.center.set(...initialCenterData);

        if (shapeData.p.a) {
            applyTween(['center.x', 'center.y'], shapeData.p, starStyle.timeline);
        }
    }

    // The number of points of the star
    if (shapeData.pt) {
        const initialPointsData = shapeData.pt.a ? shapeData.pt.k[0].s[0] : shapeData.pt.k;
        starStyle.points = initialPointsData;

        if (shapeData.pt.a) {
            applyTween(['points'], shapeData.pt, starStyle.timeline);
        }
    }

    // The rotation of the star
    if (shapeData.r) {
        const initialPointsData = shapeData.r.a ? shapeData.r.k[0].s[0] : shapeData.r.k;
        // Convert Degrees to radians
        starStyle.rotation = initialPointsData * (Math.PI / 180);

        if (shapeData.r.a) {
            // Convert Degrees to radians
            applyTween(['rotation'], shapeData.r, timeline, (value) => value * (Math.PI / 180));
        }
    }

    // The outer radius of the star
    if (shapeData.or) {
        const initialPointsData = shapeData.or.a ? shapeData.or.k[0].s[0] : shapeData.or.k;
        starStyle.outerRadius = initialPointsData;

        if (shapeData.or.a) {
            applyTween(['outerRadius'], shapeData.or, starStyle.timeline);
        }
    }

    // The inner radius of the star
    if (shapeData.ir) {
        const initialPointsData = shapeData.ir.a ? shapeData.ir.k[0].s[0] : shapeData.ir.k;
        starStyle.innerRadius = initialPointsData;

        if (shapeData.ir.a) {
            applyTween(['innerRadius'], shapeData.ir, starStyle.timeline);
        }
    }

    /* If no inner radius data was exported, this is a standard polygon.
    (Bodymoving exports "sy" for "Star Type" -- 1 == star, 2 == polygon)

    To allow us to still use the `drawStar` method in PIXI, we'll calculate the
    appropriate inner radius for a standard polygon. The relevant equation is:
      or = ir / (cos(180 / n))
    where:
      or:  Outer radius of the polygon (distance from the center to any point)
      ir:  Inner radius of the polygon (distance from the center to the midpoint of any side)
      cos: Cosine function calculated in degrees
      n:   Number of sides (or points) in the polygon

    Because the `Math.cos` equation expects radians, we translate 180 / n degrees into radians
    by multiplying by PI / 180 --> ( 180 / n ) * ( PI / 180 ) === PI / n
    */
    if (starStyle.innerRadius === undefined) {
        const innerRadius = Math.cos(Math.PI / starStyle.points) * starStyle.outerRadius;
        starStyle.innerRadius = innerRadius;
    }

    const drawStarFromProperties = (graphics) => {
        graphics
            .drawStar(
                starStyle.center.x,
                starStyle.center.y,
                starStyle.points,
                starStyle.outerRadius,
                starStyle.innerRadius,
                starStyle.rotation,
            )
            .closePath();
    };

    return {
        callback: drawStarFromProperties,
        isAnimated: Boolean(
            shapeData.p.a ||
            shapeData.pt.a ||
            shapeData.r.a ||
            shapeData.or.a ||
            (shapeData.ir && shapeData.ir.a),
        ),
    };
}