/* eslint-disable func-names, no-param-reassign */
import {
    FillStyle
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

import RGBAColor from './RGBAColor.js';

/**
 * Applies properties about this graphic object's fill based on a bodymovin export
 *
 * @param      {pixijs.Graphics}    graphicsObject  The graphics object to act on
 * @param      {object}             fillData  The fill data from bodymovin
 * @param      {Timeline}  timeline  The timeline
 * @param      {Number}             duration  The duration of the graphic on the layer
 */
export default function applyFillPropertiesFromBodymovin(graphicsObject, fillData, timeline) {
    const fillStyle = new FillStyle();
    fillStyle.timeline = new Timeline({
        target: fillStyle
    });
    timeline.addTimeline(fillStyle.timeline, 0);
    const fillColor = new RGBAColor();
    fillColor.timeline = new Timeline({
        target: fillColor
    });
    timeline.addTimeline(fillColor.timeline, 0);

    // alpha
    if (fillData.o) {
        const initialProperty = getInitialProperties(fillData.o);
        // Bodymovin opacity represents 100% as 100, PixiJS represents that as 1
        applyProperty(fillStyle, 'alpha', initialProperty, (value) => value * 0.01);
        if (fillData.o.a) {
            // Bodymovin opacity represents 100% as 100, PixiJS represents that as 1
            applyTween(['alpha'], fillData.o, fillStyle.timeline, (value) => value * 0.01);
        }
    }

    // color
    if (fillData.c) {
        if (fillData.c.a) {
            /* We have two possible formats of fill color data here. `fillData.c.k` is either itself a
            color array, e.g. [0, 0, 0, 2], or it's an array of objects with keys { e, i, n, o, s, t },
            where `s` contains the color array. */
            if (typeof fillData.c.k[0] === 'number') {
                fillColor.set(...fillData.c.k);
            } else {
                // In the case that it's an array of objects, set the fill color to the initial value.
                fillColor.set(...fillData.c.k[0].s);
            }
            applyTween(['red', 'green', 'blue', 'alpha'], fillData.c, fillColor.timeline);
        } else {
            fillColor.set(...fillData.c.k);
        }
    }

    const endFill = (graphics) => {
        graphics.endFill();
    };

    const updateFill = (graphics) => {
        fillStyle.color = fillColor.toNumber();
        graphics.beginFill(fillStyle.color, fillStyle.alpha);
        return endFill;
    };

    return {
        callback: updateFill,
        isAnimated: Boolean(fillData.o.a || fillData.c.a),
    };
}