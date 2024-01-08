/* eslint-disable func-names, no-param-reassign */

export default function enableBezierUtilities(bezierJSNamespace) {
    const LENGTH_SEGMENT_PRECISION = 0.01;
    const MAX_LENGTH_SEGMENT_ATTEMPTS = 50;

    /**
     * Takes a unitless length segment (0-1) of a curve and return what time it occurs in the curve
     * Useful for calculating places to split a curve for trim paths
     *
     * @param      {number}  lengthSegment  The length segment
     * @return     {number}                 The curve time at length segment.
     */
    bezierJSNamespace.prototype.getCurveTimeAtLengthSegment = function(lengthSegment) {
        // Easy Calculations
        if (lengthSegment <= 0) {
            return 0;
        } else if (lengthSegment >= 1) {
            return 1;
        }

        const totalLength = this.length();
        // We measure curves based on their length so get the actual length based on the unitless segment
        const length = lengthSegment * totalLength;

        // Get a close approximate
        let time = lengthSegment;

        // Give ourselves an escape hatch
        let attempts = MAX_LENGTH_SEGMENT_ATTEMPTS;
        let lastStep = 0;

        // Narrow in on the true time for the length by checking how close we are to a measured time
        while (attempts >= 0) {
            // Check our current time
            const measuredLength = this.split(time).left.length();
            const distanceOff = length - measuredLength;

            // If the distance is within our precision margin of error, return the time
            if (Math.abs(distanceOff) <= LENGTH_SEGMENT_PRECISION) {
                return time;
            }

            let step = distanceOff / totalLength;
            // If we seem to be circling around a value, cut the step size down by half
            if (Math.sign(lastStep) !== Math.sign(step)) {
                step /= 2;
            }

            // Increment our search time
            time += step;
            // Store our last step increment
            lastStep = step;
            // Decement our attempts
            attempts -= 1;
        }

        if (attempts < 0) {
            console.warn(
                `Attempted to find curve time at length ${lengthSegment}, time ${time}, but couldn't get close enough`,
            );
        }

        // If we exhausted our attempts, return the closest we got
        return time;
    };
}