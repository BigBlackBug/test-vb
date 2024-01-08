import {
    transformColorArray
} from '../../utils/index.js';

/**
 * A class to easily track and hold an RGBA color for tweening Strokes and Fills
 *
 * @class      RGBAColor (name)
 */
export default class RGBAColor {
    constructor(...args) {
        this.set(...args);
    }

    /**
     * Sets the color values
     *
     * @param      {number}  red     The red
     * @param      {number}  green   The green
     * @param      {number}  blue    The blue
     * @param      {number}  alpha   The alpha
     */
    set(red, green, blue, alpha) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.alpha = alpha;
    }

    /**
     * Transforms the current state of the RGBAColor into a hex number for use by PIXI
     *
     * @return     {number}
     */
    toNumber() {
        return transformColorArray([this.red, this.green, this.blue, this.alpha]);
    }
}