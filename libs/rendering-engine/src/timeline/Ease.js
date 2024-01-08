import BezierEasing from 'bezier-easing';

/**
 * Class for an ease, which specifys the rate of change of a tween over time.
 * Default is a linear ease
 *
 * @class      Ease (name)
 */
export default class Ease {
    /**
     * @param {Number}  outYPoint  The x point of the "out" handle
     * @param {Number}  outYPoint  The y point of the "out" handle
     * @param {Number}  inXPoint  The x point of the "in" handle
     * @param {Number}  inYPoint  The y point of the "in" handle
     */
    constructor(outXPoint = 1, outYPoint = 1, inXPoint = 0, inYPoint = 0) {
        // After Effects will sometimes export bezier X points outside of the 0-1
        // range, but appears to treat them as if they were within the range.
        this.calcBezier = BezierEasing(
            Math.min(Math.max(outXPoint, 0), 1),
            outYPoint,
            Math.min(Math.max(inXPoint, 0), 1),
            inYPoint,
        );
    }

    /**
     * Gets the ratio of completeness of the tween at a given percent of time through the tween
     *
     * @param      {Number}  progress  The progress
     * @return     {Number}  The ratio.
     */
    getRatio(progress) {
        return this.calcBezier(progress);
    }
}

export const LinearEase = new Ease();