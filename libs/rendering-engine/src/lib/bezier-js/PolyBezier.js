/* eslint-disable func-names, no-param-reassign */

export default function enablePolyBezierUtilities(bezierJSNamespace) {
    /**
     * Construct an array of lengths of each of a PolyBezier's curves
     *
     * @return     {number[]}  An array of curve lengths
     */
    bezierJSNamespace.PolyBezier.prototype.curveLengths = function() {
        return this.curves.map((curve) => curve.length());
    };

    /**
     * Gets the curve index at desired unitless length segment (0..1).
     * Basically, which curve should we be performing split operations on for splitAtLengthSegment
     *
     * @param      {number[]}  curveLengths           An array of the curve lengths
     * @param      {number}    totalLength            The total length of the curve
     * @param      {number}    desiredLengthSegment   The desired length segment (from 0..1)
     * @return     {object}    An object with the curve's index (index) and the unitless length segment (lengthSegment) for that curve
     */
    function getCurveIndexAtLengthSegment(curveLengths, totalLength, desiredLengthSegment) {
        // Precheck for easy answers
        if (desiredLengthSegment === 0) {
            return {
                index: 0,
                lengthSegment: 0,
            };
        } else if (desiredLengthSegment === 1) {
            return {
                index: curveLengths.length - 1,
                lengthSegment: 1,
            };
        }

        let currentLength = 0;
        // Loop through the curve lengths to determine where in our array the Segment occurs
        for (let index = 0; index <= curveLengths.length - 1; index += 1) {
            const curveLength = curveLengths[index];
            const curveStartSegment = currentLength / totalLength;
            const curveDuration = curveLength / totalLength;
            const curveEndSegment = curveStartSegment + curveDuration;

            // If the Segment is between the start and end of the current curve, return
            if (desiredLengthSegment >= curveStartSegment && desiredLengthSegment < curveEndSegment) {
                const lengthSegment = (desiredLengthSegment - curveStartSegment) / curveDuration;
                return {
                    index,
                    lengthSegment,
                };
            }
            currentLength += curveLength;
        }

        // Otherwise it's at the very end
        return {
            index: curveLengths.length - 1,
            lengthSegment: 1,
        };
    }

    /**
     * Splits a PolyBezier at the given unitless length segment (0..1).
     * When 1 segment value is given, will split it with only a left and right PolyBezier,
     * With 2, will return left, middle, and right.
     *
     * @param      {number}  segment1    The first unitless line segment
     * @param      {number}  [segment2]  The last unitless line segment
     * @return     {object}              Returns an object of 3 PolyBeziers: left, middle, and right
     */
    bezierJSNamespace.PolyBezier.prototype.splitAtLengthSegment = function(segment1, segment2) {
        let startSegment = segment1;
        let endSegment = segment2;

        // If segment 2 is less than 1, swap them
        if (segment2 !== undefined) {
            startSegment = Math.min(segment1, segment2);
            endSegment = Math.max(segment1, segment2);
        }

        const curveLengths = this.curveLengths();
        const totalLength = curveLengths.reduce((a, b) => a + b);

        // Get our first split
        const {
            index: startCurveIndex,
            lengthSegment: startCurveSegment,
        } = getCurveIndexAtLengthSegment(curveLengths, totalLength, startSegment);
        const startCurve = this.curve(startCurveIndex);
        // Calculate the time of the curve at the length segment
        const startCurveTime = startCurve.getCurveTimeAtLengthSegment(startCurveSegment);

        let {
            left,
            right
        } = startCurve.split(startCurveTime);
        const result = {
            left: new bezierJSNamespace.PolyBezier([...this.curves.slice(0, startCurveIndex), left]),
            middle: new bezierJSNamespace.PolyBezier(),
            right: new bezierJSNamespace.PolyBezier([right]),
        };

        // If we don't have a endSegment, add the remaining curves to the end of the right side
        // And return, we're done!
        if (endSegment === undefined) {
            this.curves.slice(startCurveIndex + 1).forEach(result.right.addCurve);
            return result;
        }

        // We have an endSegment to calculate, get end curve and segent
        const {
            index: endCurveIndex,
            lengthSegment: endCurveSegment
        } = getCurveIndexAtLengthSegment(
            curveLengths,
            totalLength,
            endSegment,
        );
        const endCurve = this.curve(endCurveIndex);

        // If the Segment begins and ends on the same curve, we need to do some special work
        if (startCurveIndex === endCurveIndex) {
            const endCurveTime = endCurve.getCurveTimeAtLengthSegment(endCurveSegment);
            // The middle of our split will be a middle split of a single curve
            const middle = endCurve.split(startCurveTime, endCurveTime);
            // Split will return a single curve normally, but if one the split times is 0 or 1, it will be an object with right & left keys
            result.middle.addCurve(middle.right ? middle.right : middle);

            // Get the remaining segment of our curve
            /* eslint-disable-next-line prefer-destructuring */
            right = endCurve.split(endCurveTime).right;
            result.right = new bezierJSNamespace.PolyBezier([
                right,
                ...this.curves.slice(startCurveIndex + 1),
            ]);

            return result;
        }

        const endCurveTime = endCurve.getCurveTimeAtLengthSegment(endCurveSegment);
        const splitCurve = endCurve.split(endCurveTime);
        /* eslint-disable-next-line prefer-destructuring */
        left = splitCurve.left;
        /* eslint-disable-next-line prefer-destructuring */
        right = splitCurve.right;

        // If we have an end segment, the current "right" value is the remaining curve from the starting curve
        // remove it from the right side, and add it to the middle
        result.middle = new bezierJSNamespace.PolyBezier([
            result.right.curves.pop(),
            ...this.curves.slice(startCurveIndex + 1, endCurveIndex),
            left,
        ]);
        // Populate the remaining segment of split
        result.right = new bezierJSNamespace.PolyBezier([
            right,
            ...this.curves.slice(endCurveIndex + 1),
        ]);

        return result;
    };

    /**
     * Boolean to indicate if a PolyBezier is closed (for use in path drawing). This is stubbed out here mostly for documentation
     */
    Object.defineProperty(bezierJSNamespace.PolyBezier.prototype, 'isClosed', {
        get: function get() {
            /* eslint-disable-next-line no-underscore-dangle */
            return this._isClosed;
        },
        set: function set(value) {
            /* eslint-disable-next-line no-underscore-dangle */
            this._isClosed = value;
        },
    });
}