/**
 * Gets the value of an object at the dotpath.
 * From: https://youmightnotneed.com/lodash/
 *
 * @param      {Object}  obj           The object
 * @param      {string}  path          The path
 * @param      {*}       defaultValue  The default value (if one doesn't exist)
 * @return     {*}  The value.
 */
export const getDotpathValue = (obj, path, defaultValue) => {
    // If path is not defined or it has false value
    if (!path) return undefined;
    // Check if path is string or array. Regex : ensure that we do not have '.' and brackets.
    // Regex explained: https://regexr.com/58j0k
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);
    // Find value if exist return
    const value = pathArray.reduce((prevObj, key) => prevObj && prevObj[key], obj);
    // if value is undefined, we'll use the default;
    if (value === undefined) {
        return defaultValue;
    }
    return value;
};

/**
 * Sets the value of an object at the dotpath.
 * From: https://youmightnotneed.com/lodash/
 *
 * @param      {Object}  obj     The object
 * @param      {string}  path    The path
 * @param      {*}       value   The value (if one doesn't exist)
 */
export const setDotpathValue = (obj, path, value) => {
    // Regex explained: https://regexr.com/58j0k
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g);

    pathArray.reduce((acc, key, i) => {
        if (acc[key] === undefined) acc[key] = {};
        if (i === pathArray.length - 1) acc[key] = value;
        return acc[key];
    }, obj);
};