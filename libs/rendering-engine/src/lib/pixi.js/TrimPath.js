/* eslint-disable no-underscore-dangle */

/**
 * The Trim Path property, which stores and controls the start, end, and offset values of a path
 * Start and end are on a unitless range of 0-1 over the length of a path (not the t value of the bezier)
 * Offset is a unitless value where 0 is no offset and 1 is the offset a full path length (you can have values less than 0 and greater than 1)
 *
 * @class      TrimPath (name)
 */
export default class TrimPath {
    constructor(start = 0, end = 1, offset = 0) {
        this.start = start;
        this.end = end;
        this.offset = offset;
    }

    get start() {
        return this._start;
    }
    set start(value) {
        this._start = value;
    }

    get end() {
        return this._end;
    }
    set end(value) {
        this._end = value;
    }

    get offset() {
        return this._offset;
    }
    set offset(value) {
        this._offset = value;
    }
}