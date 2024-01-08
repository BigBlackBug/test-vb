// Vendor
import _ from 'lodash';
import keyCodes from './keyCodes.js';

/* eslint-disable import/prefer-default-export */
export {
    default as uuid
}
from './uuid.js';

export {
    fpsToRGB,
    PerformanceProfiler,
    PerformanceTimeline
}
from './performanceLogger.js';

export * from './audio.js';

export {
    keyCodes
};

export * from './browsers.js';

export * from './classUtils.js';

export * from './colors.js';

export * from './async.js';

export {
    addFullscreenEventListener,
    removeFullscreenEventListener,
    requestFullscreen,
    exitFullscreen,
    isFullscreenEnabled,
}
from './fullscreen.js';
export {
    onMouseMoveDuringDrag
}
from './events.js';

/**
 * Utility function to ensure that object properties are copied by value, and
 * not by reference. Copied from PixiJS's TextStyle
 *
 * @param      {object}  target       Target object to copy properties into
 * @param      {object}  source       Source object for the proporties to copy
 * @param      {Array}   propertyObj  array containing properties names we want
 *                                    to loop over
 */
export function deepCopyProperties(target, source, propertyObj) {
    propertyObj.forEach((propertyName) => {
        if (Array.isArray(source[propertyName])) {
            /* eslint-disable-next-line no-param-reassign */
            target[propertyName] = _.cloneDeep(source[propertyName].slice());
        } else {
            /* eslint-disable-next-line no-param-reassign */
            target[propertyName] = _.cloneDeep(source[propertyName]);
        }
    });
}

/**
 * Merges two or more arrays in order.
 * ex: zipArrays([1,4,7], [2,5,8], [3,6,9]) = [1,2,3,4,5,6,7,8,9]
 * From: https://stackoverflow.com/questions/10308012/combine-two-arrays-in-a-zipping-fashion-javascript/55077593
 *
 * @param  {any[]} a Array to zip
 * @param  {...any[]} b Arrays to zip
 * @returns {any[]} Zipped arrays
 */
export function zipArrays(a = [], ...b) {
    // eslint-disable-next-line no-nested-ternary
    if (b.length) {
        return a.length ? [a[0], ...zipArrays(...b, a.slice(1))] : zipArrays(...b);
    }
    return a;
}

/**
 * Converts a passed degree into radians
 *
 * @param      {number}  degrees  The degrees
 * @returns     {number}  The converted degrees
 */
export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Parses a url string into an object of relevant parts to the url
 * Returns object of matching parts
 *   fullMatch   (i.e.  http://www.waymark.com/)
 *   protocol   (i.e. https://)
 *   subDomain   (i.e. www, blog)
 *   domainName   (i.e. waymark, social)
 *   topLevelDomain   (i.e. com, pr)
 *   path   (i.e. /signup/preview)
 *   queryParameters   (i.e. ?foo=bar)
 *
 * Based on: https://stackoverflow.com/a/41705761/1340405
 *
 * @param  {string}  url The url to parse
 * @returns {object}      The matched object of url parts
 */
export function getURLParts(url) {
    const parser = document.createElement('a');
    const searchObject = {};

    // Let the browser do the work
    parser.href = url;

    const queries = parser.search.replace(/^\?/, '').split('&');

    // Convert query string to object
    for (let i = 0; i < queries.length; i += 1) {
        const [key, value] = queries[i].split('=');
        searchObject[key] = value;
    }

    return {
        searchObject,
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: parser.pathname,
        search: parser.search,
        hash: parser.hash,
    };
}

/**
 * Given a filepath will return the file extension.
 *
 * @param {string} path The path to inspect
 * @returns {string} The file extension
 */
export function getExtension(path) {
    const basename = path.split(/[\\/]/).pop();
    const extensionPosition = basename.lastIndexOf('.');

    // If we don't have a file name or we can't find a dot
    // return an empty string
    if (basename === '' || extensionPosition < 1) {
        return '';
    }

    return basename.slice(extensionPosition + 1);
}

const URL_REGEX = new RegExp('^(?:[a-z]+:)?//', 'i');

/**
 * Check if a path string is a URL.
 * From https://stackoverflow.com/a/19709846
 *
 * @param   {string}   path  Path
 * @returns  {boolean}        Is path a URL
 */
export function isURL(path) {
    return URL_REGEX.test(path);
}

/**
 * Perform a simple path join on two strings.
 * This can be used for filepaths or URLs when the source format is not known.
 * When the source format is known, use path.join or url.resolve instead.
 *
 * Examples:
 *   simplePathJoin('a', 'b') -> 'a/b'
 *   simplePathJoin('/users/asdf/', '/jkl') -> '/users/asdf/jkl`
 *   simplePathJoin('https://example.com', 'hello.html') -> 'https://example.com/hello.html'
 *
 * @param   {string}  pathOne  Path one
 * @param   {string}  pathTwo  Path two
 * @returns  {string}           Joined path
 */
export function simplePathJoin(pathOne, pathTwo) {
    if (pathOne.length && pathTwo.length) {
        if (pathOne[pathOne.length - 1] === '/' && pathTwo[0] === '/') {
            return `${pathOne}${pathTwo.substring(1)}`;
        }

        if (pathOne[pathOne.length - 1] !== '/' && pathTwo[0] !== '/') {
            return `${pathOne}/${pathTwo}`;
        }
    }

    return `${pathOne}${pathTwo}`;
}

/**
 * Translate a value within one range to the proportional value within another
 *
 * @param  {number} sourceValue   Value to translate
 * @param  {number[]}  sourceRange  Tuple, Min and max values for the source range
 * @param  {number[]}  targetRange  Tuple, Min and max values for the target range
 * @returns {number}  Translated number
 *
 * E.g.:
 *  translateValueToRange(.5, [0, 1], [1, 10]) => 5.5
 * Inspiration:
 *  https://gamedev.stackexchange.com/questions/33441/how-to-convert-a-number-from-one-min-max-set-to-another-min-max-set
 */
export const translateValueToRange = (
    sourceValue, [sourceMin, sourceMax], [targetMin, targetMax],
) => targetMin + ((sourceValue - sourceMin) / (sourceMax - sourceMin)) * (targetMax - targetMin);

export const isNodeExecutionEnvironment = () =>
    typeof process !== 'undefined' && process.release.name === 'node';