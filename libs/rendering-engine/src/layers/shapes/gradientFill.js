/* eslint-disable func-names, no-param-reassign */
import {
    Matrix
} from 'pixi.js';
import {
    Timeline
} from '../../timeline/index.js';
import {
    applyTween,
    getInitialProperties
} from '../../manifest/index.js';
import {
    applyProperty
} from '../utils/index.js';
import GradientFillStyle from './GradientFillStyle.js';

const FILL_TYPE_NUMBER_TO_TYPE = {
    1: GradientFillStyle.FILL_TYPE.linear,
    2: GradientFillStyle.FILL_TYPE.radial,
};

/**
 * Applies properties about this graphic object's fill based on a bodymovin export
 *
 * @param      {pixijs.Graphics}    graphicsObject  The graphics object to act on
 * @param      {object}             fillData  The fill data from bodymovin
 * @param      {Timeline}  timeline  The timeline
 * @param      {Number}             duration  The duration of the graphic on the layer
 */
export default function applyGradientFillPropertiesFromBodymovin(
    graphicsObject,
    fillData,
    timeline,
) {
    const gradientFillStyle = new GradientFillStyle();
    gradientFillStyle.timeline = new Timeline({
        target: gradientFillStyle
    });
    timeline.addTimeline(gradientFillStyle.timeline, 0);

    // type
    gradientFillStyle.type = FILL_TYPE_NUMBER_TO_TYPE[fillData.t];

    const {
        o: opacityData,
        s: startPointData,
        e: endPointData,
        g: gradientData,
        h: highlightLengthData,
        a: highlightAngleData,
    } = fillData;

    // alpha
    if (opacityData) {
        const initialProperty = getInitialProperties(opacityData);
        // Bodymovin opacity represents 100% as 100, PixiJS represents that as 1
        applyProperty(gradientFillStyle, 'alpha', initialProperty, (value) => value * 0.01);
        if (opacityData.a) {
            // Bodymovin opacity represents 100% as 100, PixiJS represents that as 1
            applyTween(['alpha'], opacityData, gradientFillStyle.timeline, (value) => value * 0.01);
        }
    }

    // Start Point
    if (startPointData) {
        const initialProperty = getInitialProperties(startPointData);
        applyProperty(gradientFillStyle, 'startPoint', initialProperty);
        // Animated?
        if (startPointData.a) {
            gradientFillStyle.startPoint.set(...startPointData.k[0].s);
            applyTween(['startPoint.x', 'startPoint.y'], startPointData, gradientFillStyle.timeline);
        }
    }

    // End Point
    if (endPointData) {
        const initialProperty = getInitialProperties(endPointData);
        applyProperty(gradientFillStyle, 'endPoint', initialProperty);
        // Animated?
        if (endPointData.a) {
            gradientFillStyle.endPoint.set(...endPointData.k[0].s);
            applyTween(['endPoint.x', 'endPoint.y'], endPointData, gradientFillStyle.timeline);
        }
    }

    // gradient colors
    if (gradientData) {
        gradientFillStyle.colorStopCount = gradientData.p;

        // We need one of the arrays to check how many opacityStops to make
        const firstArray = gradientData.k.a ? gradientData.k.k[0].s : gradientData.k.k;
        // Make a shallow copy instead of assigning by reference
        gradientFillStyle.stopProperties = firstArray.concat();

        if (gradientData.k.a) {
            // Because the property is an array of every stop, when the tween updates we
            // want each property to change independently, so we want to treat the stopProperties
            // array as an object, with keys that are the index.
            // This will allow greensock to change each color option independently because each property
            // key & value are assigned and tweened accordingly

            // Generate an array of the indexes to pass to applyTween i.e. [0, 1, 2, 3, ...]
            const indexArray = [];
            for (let index = 0; index < firstArray.length; index += 1) {
                indexArray.push(`stopProperties[${index}]`);
            }
            applyTween([...indexArray], gradientData.k, gradientFillStyle.timeline);
        }
    }

    // Highlight Length (Only on Radial Gradients)
    // Recorded as a percentage of the overall size (so we divide by 100)
    if (highlightLengthData) {
        const initialProperty = getInitialProperties(highlightLengthData);
        applyProperty(gradientFillStyle, 'highlightLength', initialProperty, (value) => value / 100);
        // Animated?
        if (highlightLengthData.a) {
            applyTween(
                ['highlightLength'],
                highlightLengthData,
                gradientFillStyle.timeline,
                (value) => value / 100,
            );
        }
    }

    // Highlight Angle (Only on Radial Gradients)
    if (highlightAngleData) {
        const initialProperty = getInitialProperties(highlightAngleData);
        // Bodymovin is in degrees, PixiJS is in radians
        applyProperty(
            gradientFillStyle,
            'highlightAngle',
            initialProperty,
            (value) => value * (Math.PI / 180),
        );
        // Animated?
        if (highlightAngleData.a) {
            applyTween(
                ['highlightAngle'],
                highlightAngleData,
                gradientFillStyle.timeline,
                (value) => value * (Math.PI / 180),
            );
        }
    }

    const endFill = (graphics) => {
        graphics.endFill();
    };

    const updateFill = (graphics) => {
        // FIXME: A graphics object with multiple drawing styles won't have an accurate bounds,
        //        it will just be the bounds off the last drawing style added
        const textureBounds = graphics.drawingStyle.getBounds();
        const center = graphics.pivot.clone();
        const texture = graphics.generateGradientFillTexture(gradientFillStyle, textureBounds, center);
        const textureTransformMatrix = new Matrix(1, 0, 0, 1, textureBounds.x, textureBounds.y);
        graphics.beginTextureFill({
            texture: texture,
            color: 0xffffff,
            alpha: gradientFillStyle.alpha,
            matrix: textureTransformMatrix
        });
        return endFill;
    };

    return {
        callback: updateFill,
        isAnimated: Boolean(
            opacityData.a ||
            startPointData.a ||
            endPointData.a ||
            gradientData.k.a ||
            (highlightLengthData && highlightLengthData.a) ||
            (highlightAngleData && highlightAngleData.a),
        ),
    };
}