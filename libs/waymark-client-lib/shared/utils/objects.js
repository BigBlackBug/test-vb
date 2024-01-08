import _ from 'lodash';

/**
 * Takes an object and a casing conversion function, runs the object's keys through the converter,
 * and returns a duplicated object with those new formatted keys.
 *
 * @param {Object}  object  An object whose keys we wish to convert to a different casing style.
 * @param {func}    casingConversionFunction  Function takes an object key and converts it to the desired casing style.
 *
 * @returns {Object}  A duplicate of the input object with converted keys
 *
 * @example
 * // Ouput: { HI: "hello" }
 * convertObjectKeyCasing({ hi: "hello" }, (key) => key.toUpperCase());
 */
function convertObjectKeyCasing(object, casingConversionFunction) {
    const convertedObject = {};

    Object.entries(object).forEach(([key, value]) => {
        convertedObject[casingConversionFunction(key)] = value;
    });

    return convertedObject;
}

/**
 * Takes an object and returns a copy of it with all of its keys converted to camelCase
 *
 * @param {Object} object   An object with keys in snake case style which should be converted to camel case
 * @returns {Object}  A duplicate of the input object, with all keys converted to camel case style
 *
 * @example
 * // Output: { catGuid: "purr-112-mew" }
 * convertObjectKeysToCamelCase({
 *  cat_guid: "purr-112-mew",
 * });
 */
export const convertObjectKeysToCamelCase = (object) => convertObjectKeyCasing(object, _.camelCase);

/**
 * Takes an object and returns a copy of it with all of its keys converted to snake_case
 *
 * @param {Object} object   An object with keys in camel case style which should be converted to snake case
 * @returns {Object}  A duplicate of the input object, with all keys converted to snake case style
 *
 * @example
 * // Output: { dog_guid: "woof-123-arf" }
 * convertObjectKeysToCamelCase({
 *  dogGUID: "woof-123-arf",
 * });
 */
export const convertObjectKeysToSnakeCase = (object) => convertObjectKeyCasing(object, _.snakeCase);