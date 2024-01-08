/* eslint-disable func-names, no-param-reassign */
import _ from 'lodash';
import Bezier, {
    PolyBezier
} from 'bezier-js';
import {
    Rectangle
} from 'pixi.js';
import {
    Timeline
} from '../../timeline/index.js';
import {
    applyTween
} from '../../manifest/index.js';

/**
 * Constructs a PolyBezier curve from the vertexes and control points exported by bodymovin
 * The input data will be in the format of:
 * {
 *   v: [[x,y],...], // The verticies
 *   i: [[x,y],...], // The bezier in points (relative to the vertex)
 *   o: [[x,y],...], // The bezier in points (relative to the destination point)
 *   c: false        // If the curve is closed
 * }
 *
 * @param      {array}  pathData  The path data from bodymovin
 */
export function constructPolyBezierFromData(pathData) {
    const polyBezier = new PolyBezier();
    pathData.v.forEach((vertexData, index) => {
        // If the path isn't closed, don't construct the last curve
        if (index === pathData.v.length - 1 && !pathData.c) {
            polyBezier.isClosed = false;
            return;
        }
        polyBezier.isClosed = true;

        // Get the starting control point
        const startingControlPointData = pathData.o[index];

        // Get the destination Vertex and control point (looks back to the beginning if at the end)
        const destinationVertexIndex = index === pathData.v.length - 1 ? 0 : index + 1;
        const destinationVertexData = pathData.v[destinationVertexIndex];
        const destinationControlPointData = pathData.i[destinationVertexIndex];

        polyBezier.addCurve(
            new Bezier(
                // Starting Vertex x, y
                vertexData[0],
                vertexData[1],
                // Starting (out) control point x, y
                vertexData[0] + startingControlPointData[0],
                vertexData[1] + startingControlPointData[1],
                // Destination (in) control point x, y
                destinationVertexData[0] + destinationControlPointData[0],
                destinationVertexData[1] + destinationControlPointData[1],
                // Destination Vertex x, y
                destinationVertexData[0],
                destinationVertexData[1],
            ),
        );
    });

    return polyBezier;
}

/**
 * Construct a set of tweens for the bezier curves exported from bodymovin
 * NOTE: It's currently not possible to construct a path that removes a point during its tween
 *
 * @param      {PolyBezier}    pathBezierCurves  The PolyBezier object that represents the path
 * @param      {object}        shapeData         The shape data exported from bodymovin
 * @param      {Timeline}      timeline          The timeline to place the tweens on
 */
function constructTweensForBezierFromBodymovin(pathBezierCurves, shapeData, timeline) {
    // Re-construct the keyframes so they're easier to parse through
    const keyframedBezierPaths = shapeData.ks.k.map((keyframe) => {
        if (!keyframe.s || !keyframe.e) {
            return keyframe;
        }
        return _.extend({}, keyframe, {
            s: constructPolyBezierFromData(keyframe.s[0]),
            e: constructPolyBezierFromData(keyframe.e[0]),
        });
    });

    // Loop through our bezier paths and construct tweens for each of the points
    pathBezierCurves.curves.forEach((bezierPath, bezierPathIndex) => {
        bezierPath.points.forEach((point, pointIndex) => {
            const pointKeyframes = keyframedBezierPaths.map((keyframe) => {
                if (!keyframe.s || !keyframe.e) {
                    return keyframe;
                }
                return _.extend({}, keyframe, {
                    s: [
                        keyframe.s.curves[bezierPathIndex].points[pointIndex].x,
                        keyframe.s.curves[bezierPathIndex].points[pointIndex].y,
                    ],
                    e: [
                        keyframe.e.curves[bezierPathIndex].points[pointIndex].x,
                        keyframe.e.curves[bezierPathIndex].points[pointIndex].y,
                    ],
                });
            });

            applyTween(
                [
                    `curves[${bezierPathIndex}].points[${pointIndex}].x`,
                    `curves[${bezierPathIndex}].points[${pointIndex}].y`,
                ], {
                    k: pointKeyframes
                },
                timeline,
            );
        });
    });
}

// TODO: Move path drawing functionality from Graphics to the PathStyle
class PathStyle {
    /**
     * Constructs the object.
     *
     * @param      {bezierjs.PolyBezier}  pathBezierCurves   The paths to draw
     */
    constructor(pathBezierCurves) {
        this.pathBezierCurves = pathBezierCurves;
    }

    get pathBezierCurves() {
        // eslint-disable-next-line no-underscore-dangle
        return this._pathBezierCurves;
    }
    set pathBezierCurves(value) {
        // eslint-disable-next-line no-underscore-dangle
        this._pathBezierCurves = value;
    }

    getBounds() {
        const {
            x,
            y
        } = this.pathBezierCurves.bbox();
        return new Rectangle(x.min, y.min, x.size, y.size);
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
export default function applyPathPropertiesFromBodymovin(
    graphicsObject,
    shapeData,
    timeline,
    duration,
) {
    // Start by creating an array of path control points
    // If it is animated, take the starting value of the first tween, otherwise it's just the value
    const initialPathData = shapeData.ks.a ? shapeData.ks.k[0].s[0] : shapeData.ks.k;
    const pathBezierCurves = constructPolyBezierFromData(initialPathData);
    pathBezierCurves.timeline = new Timeline({
        target: pathBezierCurves
    });
    timeline.addTimeline(pathBezierCurves.timeline, 0);

    graphicsObject.pathBezierCurves = pathBezierCurves;
    graphicsObject.drawingStyle = new PathStyle(pathBezierCurves);

    // Animate it
    if (shapeData.ks.a) {
        constructTweensForBezierFromBodymovin(
            pathBezierCurves,
            shapeData,
            pathBezierCurves.timeline,
            duration,
        );
    }
    // Return an update callback that will redraw the path.
    return {
        callback: graphicsObject.drawPath.bind(graphicsObject),
        isAnimated: Boolean(shapeData.ks.a),
    };
}