/* eslint-disable func-names, no-param-reassign */
import {
    LineStyle
} from 'pixi.js';
import {
    Timeline
} from '../../timeline/index.js';
import {
    applyTween
} from '../../manifest/index.js';

import RGBAColor from './RGBAColor.js';

/**
 * Applies properties about this graphic object's stroke based on a bodymovin export
 *
 * @param      {pixijs.Graphics}    graphicsObject  The graphics object to act on
 * @param      {object}             strokeData  The stroke data from bodymovin
 * @param      {Timeline}  timeline    The timeline
 */
export default function applyStrokePropertiesFromBodymovin(graphicsObject, strokeData, timeline) {
    const lineStyle = new LineStyle();
    lineStyle.timeline = new Timeline({
        target: lineStyle
    });
    timeline.addTimeline(lineStyle.timeline, 0);
    const lineColor = new RGBAColor();
    lineColor.timeline = new Timeline({
        target: lineColor
    });
    timeline.addTimeline(lineColor.timeline, 0);

    // TODO: Properties
    // Line Cap: lc
    // Line Join: lj
    // Miter Limit: ml, ml2

    // line color
    if (strokeData.c) {
        if (strokeData.c.a) {
            // Set the initial line color
            lineColor.set(...strokeData.c.k[0].s);
            applyTween(['red', 'green', 'blue', 'alpha'], strokeData.c, lineColor.timeline);
        } else {
            lineColor.set(...strokeData.c.k);
        }
    }

    // line width
    if (strokeData.w) {
        if (strokeData.w.a) {
            // When animated, the value is an array
            [lineStyle.width] = strokeData.w.k[0].s;
            applyTween(['width'], strokeData.w, lineStyle.timeline);
        } else {
            lineStyle.width = strokeData.w.k;
        }
    }

    // line alpha
    if (strokeData.o) {
        if (strokeData.o.a) {
            lineStyle.alpha = strokeData.o.k[0].s * 0.01;
            // Bodymovin opacity represents 100% as 100, PixiJS represents that as 1
            applyTween(['alpha'], strokeData.o, lineStyle.timeline, (value) => value * 0.01);
        } else {
            // Bodymovin opacity represents 100% as 100, PixiJS represents that as 1
            lineStyle.alpha = strokeData.o.k * 0.01;
        }
    }

    const endStroke = (graphics) => {
        // Reset the linestyle to be invisible
        graphics.lineStyle(0, 0, 0, 0.5, false);
    };

    const updateStroke = (graphics) => {
        lineStyle.color = lineColor.toNumber();

        graphics.lineStyle(
            lineStyle.width,
            lineStyle.color,
            lineStyle.alpha,
            lineStyle.alignment,
            lineStyle.native,
        );
        return endStroke;
    };

    return {
        callback: updateStroke,
        isAnimated: Boolean(strokeData.c.a || strokeData.w.a || strokeData.o.a),
    };
}