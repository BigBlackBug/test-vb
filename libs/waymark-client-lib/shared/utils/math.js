/**
 * Parses a value into a base 10 integer
 *
 * @param {string} value
 */
export const parseIntegerValue = (value) => parseInt(value, 10);

/**
 * Clamps a number value between a min and max
 *
 * @param {number} value  The value to clamp
 * @param {number} min    The lower bound of the range the value is being clamped within
 * @param {number} max    The upper bound of the range the value is being clamped within
 */
export const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

/**
 * Maps a number value within a given number range to a percentage range from 0-1
 *
 * @param {number} value  The value to map to a percentage
 * @param {number} min    Lower bound of the range to map to 0
 * @param {number} max    Upper bound number of the range to map to 1
 */
export const mapRangeValueToPercentage = (value, min, max) => (value - min) / (max - min);

/**
 * Maps a number from its initial range to a different number range
 * ie, 1 on a scale from 0-2 -> 50 on a scale from 0-100
 *
 * @param {number} value      The value on the source range to convert to our target range
 * @param {number} sourceMin  The lower bound of the source range
 * @param {number} sourceMax  The upper bound of the source range
 * @param {number} targetMin  The lower bound of the target range
 * @param {number} targetMax  THe upper bound of the target range
 */
export const convertRange = (value, sourceMin, sourceMax, targetMin, targetMax) =>
    targetMin + mapRangeValueToPercentage(value, sourceMin, sourceMax) * (targetMax - targetMin);

/**
 * Takes a number and returns a float with the desired level of decimal precision
 * This is distinct from toFixed() because it returns a usable number rather than a string
 *
 * @param {number} value                  The value to modify the precision for
 * @param {number} decimalPlacePrecision  Number of decimal places that the output should have
 */
export const toPrecision = (value, decimalPlacePrecision) => {
    const precisionMultiplier = 10 ** decimalPlacePrecision;

    return Math.round(value * precisionMultiplier) / precisionMultiplier;
};

/**
 * Takes a number and a target number and returns true if the value is within a given precision
 * of the target value
 *
 * @param {number} value - The value to check
 * @param {number} target - The target value
 * @param {number} precision - The precision to check against
 */
export const isCloseTo = (value, target, precision = 0.01) => {
    const lowerBound = target - precision;
    const upperBound = target + precision;

    return value >= lowerBound && value <= upperBound;
};

/**
 * Translate a value within one range to the proportional value within another
 * @param  {number} sourceValue   Value to translate
 * @param  {tuple}  sourceRange   Min and max values for the source range
 * @param  {tuple}  targetRange   Min and max values for the target range
 * @param  {number} [precisionPoint]   Optional value to round decimal points.
 * @returns {number}  Translated number
 *
 * E.g.:
 *  translateValueToRange(.5, [0, 1], [1, 10]) => 5.5
 * Inspiration:
 *  https://gamedev.stackexchange.com/questions/33441/how-to-convert-a-number-from-one-min-max-set-to-another-min-max-set
 */
export const translateValueToRange = (
    sourceValue, [sourceMin, sourceMax], [targetMin, targetMax],
    precisionPoint = null,
) => {
    const rawValue =
        targetMin + ((sourceValue - sourceMin) / (sourceMax - sourceMin)) * (targetMax - targetMin);
    if (precisionPoint) {
        return toPrecision(rawValue, precisionPoint);
    }

    return rawValue;
};