import _ from 'lodash';
import {
    Point
} from 'pixi.js';

export default class GradientFillStyle {
    static FILL_TYPE = {
        linear: 'linear',
        radial: 'radial',
    };

    constructor() {
        this.type = this.constructor.FILL_TYPE.linear;
        this.startPoint = new Point();
        this.endPoint = new Point();
        this.highlightLength = 0;
        this.highlightAngle = 0;
        this.colorStopCount = 0;
        this.stopProperties = [];
    }

    clone() {
        const clonedObject = new this.constructor();
        clonedObject.type = this.type;
        clonedObject.startPoint.copyFrom(this.startPoint);
        clonedObject.endPoint.copyFrom(this.endPoint);
        clonedObject.highlightLength = this.highlightLength;
        clonedObject.highlightAngle = this.highlightAngle;
        clonedObject.colorStopCount = this.colorStopCount;
        clonedObject.stopProperties = this.stopProperties.concat();

        return clonedObject;
    }

    parseStopProperties() {
        // Each stop is composed of the position and then r, g, b
        const colorStopsArray = _.chunk(this.stopProperties.slice(0, this.colorStopCount * 4), 4);
        // Each stop is composed of the position and then the alpha
        const alphaStopsArray = _.chunk(this.stopProperties.slice(this.colorStopCount * 4), 2);

        // If we have no alpha stops, we assume it's just an array of full opacity always
        if (!alphaStopsArray.length) {
            alphaStopsArray.push([0, 1], [1, 1]);
        }

        // Combine the arrays
        const stops = colorStopsArray.concat(alphaStopsArray);
        // Sort by comparing the positions of each stop, ordering from 0 -> 1
        stops.sort((a, b) => a[0] - b[0]);

        // Now modify the stops so they contain full rgba values
        stops.forEach((stop, index) => {
            const [position] = stop;
            // We're modifying an Alpha stop
            if (stop.length === 2) {
                // look ahead to the next color stop for color info
                let nextStop = stops.slice(index).find((s) => s.length > 2);

                // If this is the first stop, we use the next color stop to determine color info
                if (index === 0) {
                    // The color info will be the same so add it to the stop
                    stop.splice(1, 0, ...nextStop.slice(1));
                    return;
                }

                // Otherwise look back one
                const previousStop = stops[index - 1];
                const [prevPosition, prevRed, prevGreen, prevBlue] = previousStop;
                // If we have no next colors to look for, we use the previous one (because it won't change)
                if (!nextStop) {
                    nextStop = previousStop;
                }

                const [nextPosition, nextRed, nextGreen, nextBlue] = nextStop;

                // If the stop occurs at the same position as the next or previous, use that
                if (position === prevPosition) {
                    stop.splice(1, 0, prevRed, prevGreen, prevBlue);
                    return;
                } else if (position === nextPosition || prevPosition === nextPosition) {
                    stop.splice(1, 0, nextRed, nextGreen, nextBlue);
                    return;
                }

                // Get the value of the colors at this alpha stop
                const getNewColor = (previousColor, nextColor) =>
                    (nextColor - previousColor) *
                    ((position - prevPosition) / (nextPosition - prevPosition)) +
                    previousColor;

                stop.splice(
                    1,
                    0,
                    getNewColor(prevRed, nextRed),
                    getNewColor(prevGreen, nextGreen),
                    getNewColor(prevBlue, nextBlue),
                );
            } else {
                // We're modifying a color stop
                // look ahead to the next alpha step for alpha info
                let nextStop = stops.slice(index).find((s) => s.length === 2);

                // If this is the first stop, we use the next alpha stop to determine alpha info
                if (index === 0) {
                    // The alpha info will be the same so add it to the stop
                    stop.push(nextStop[1]);
                    return;
                }

                // Otherwise look back one
                const previousStop = stops[index - 1];
                const prevPosition = previousStop[0];
                const prevAlpha = previousStop[4];
                // If we have no next colors to look for, we use the previous one (because it won't change)
                if (!nextStop) {
                    // Fake a alpha stop from the previous data
                    nextStop = [previousStop[0], previousStop[4]];
                }

                const nextPosition = nextStop[0];
                const nextAlpha = nextStop[1];

                // If the stop occurs at the same position as the next or previous, use that
                if (position === prevPosition) {
                    stop.push(prevAlpha);
                    return;
                } else if (position === nextPosition || prevPosition === nextPosition) {
                    stop.push(nextAlpha);
                    return;
                }

                // Get the value of the colors at this alpha stop
                const stepAlpha =
                    (nextAlpha - prevAlpha) * ((position - prevPosition) / (nextPosition - prevPosition)) +
                    prevAlpha;

                stop.push(stepAlpha);
            }
        });

        return stops;
    }
}