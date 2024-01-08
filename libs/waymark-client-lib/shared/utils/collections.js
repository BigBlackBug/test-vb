// Vendor
import _ from 'lodash';
import {
    addQueryParametersToURL
} from 'shared/utils/urls.js';

// Square pixel area to target when determining the dimensions to
// display the header logo at
// This is a pretty arbitrary number that felt good
const HEADER_LOGO_DISPLAY_AREA = 10000;

/**
 * Replace an item (or multiple items) in an array of objects if an existing item
 * with the same identifier property is found. Otherwise, add the item(s) to the
 * end of the collection.
 *
 * @param   {Array}            collection  - The collection to copy and modify.
 * @param   {Object || Array}  toUpdate    - New item(s) to replace existing item(s) or add.
 * @param   {String}           idProp      - Property name to use for id comparison.
 * @param   {Number|null}      insertIndex - The index at which we want to insert new images at
 * @return  {Array}   Modified copy of the collection.
 */
export const replaceOrAdd = (collection, toUpdate, idProp, insertIndex = null) => {
    const collectionCopy = [...collection];

    let itemsToUpdate = [];

    // If we were provided an array of items already, we're good.
    // Otherwise, let's contruct an array of one item.
    if (Array.isArray(toUpdate)) {
        itemsToUpdate = toUpdate;
    } else {
        itemsToUpdate = [toUpdate];
    }

    // If we have an index to insert at, reverse the array so it maintains the same order
    // as we insert them one-by-one into the array
    if (insertIndex !== null) {
        itemsToUpdate = _.reverse(itemsToUpdate);
    }

    itemsToUpdate.forEach((item) => {
        const itemIndex = _.findIndex(collection, (elem) => elem[idProp] === item[idProp]);

        if (itemIndex > -1) {
            collectionCopy[itemIndex] = item;
        } else {
            // If we don't have an insertIndex, add them to the end of the collection
            const spliceIndex = insertIndex === null ? collectionCopy.length : insertIndex;
            collectionCopy.splice(spliceIndex, 0, item);
        }
    });

    return collectionCopy;
};

/**
 * Sorts an array of objects with a given property to match the ordering of an array of values for that property
 *
 * ie, collection: [{id: 1}, {id: 2}, {id: 3}] + id values: [3,1,2] -> [{id: 3}, {id: 1}, {id: 2}]
 *
 * @param {object[]}  collection      Collection of objects to sort
 * @param {*[]}       valuesList      Array of unique values for the given prop ordered how the collection should be ordered
 * @param {string}    valuePropName   Name of the property that we should sort on based on the given values list
 * @param {func}      [formatCollectionItem]    Optional formatting function to apply formatting to each collection item
 */
export const orderCollectionByValuesList = (
    collection,
    valuesList,
    valuePropName,
    formatCollectionItem = null,
) => {
    if (_.isEmpty(collection) || _.isEmpty(valuesList)) return [];

    const orderedCollection = valuesList.reduce((currentOrderedCollection, collectionValue) => {
        // Find the collection item matching the current value
        const matchingCollectionItem = collection.find(
            (collectionItem) => collectionItem[valuePropName] === collectionValue,
        );

        if (matchingCollectionItem) {
            // If we found a matching collection item for the current value, add it to our ordered collection
            return currentOrderedCollection.concat(
                formatCollectionItem ? // Format the matching item if a formatter function was provided
                formatCollectionItem(matchingCollectionItem) :
                matchingCollectionItem,
            );
        }

        return currentOrderedCollection;
    }, []);

    return orderedCollection;
};

/**
 * Given a collection of identity values (e.g., slugs, guids, etc) and one or multiple
 * objects, remove the objects` identity values from the collection, based on the provided
 * property value.
 * @param  {Array} collection   Collection of identity property values.
 * @param  {Array || Object} toRemove   One or many objects with the `idProp` property
 * @param  {String || String[]} idProp  The name of the identity property or array of properties on the `toRemove` objects.
 * @return  {Array} Modified copy of the collection.
 */
export const removePropertyFromCollection = (collection, toRemove, idProp) => {
    const collectionCopy = [...collection];

    let itemsToRemove = [];

    // If we were provided an array of items already, we're good.
    // Otherwise, let's contruct an array of one item.
    if (Array.isArray(toRemove)) {
        itemsToRemove = toRemove;
    } else {
        itemsToRemove = [toRemove];
    }

    const idPropsToRemove = Array.isArray(idProp) ? idProp : [idProp];

    // Construct an array of all item values which we want to remove from the collection
    const propsToRemove = itemsToRemove.reduce(
        (currentPropsToRemove, item) =>
        currentPropsToRemove.concat(idPropsToRemove.map((propToRemove) => item[propToRemove])), [],
    );

    return _.without(collectionCopy, ...propsToRemove);
};

/**
 * Format an imgix image URL to be better optimized for use as a CSS background image
 *
 * @param  {string} imgixURL    Image URL we're formatting to be used as a background image
 * @return {string}             Background image URL
 */
/* eslint-disable-next-line camelcase */
export const formatImgixURLForBackgroundImage = (imgixURL) => {
    const {
        devicePixelRatio
    } = window;

    /* eslint-disable-next-line camelcase */
    if (!imgixURL) {
        return null;
    }

    // The pixel ratio needs to be an integer between 1 and 3. This will pick the closest
    // value to the actual pixel ratio of the device, up to 3.
    const adjustedRatio = Math.min(3, Math.max(1, devicePixelRatio.toFixed(0)));

    /*
     * There are CSS tricks to emulate srcset in CSS but they require multiple
     * definitions of `background-image` that isn't easy to replicate in React
     * due to its usage of Objects to specify style attributes.
     *
     * Final note: Imgix's docs claim that `dpr` requires a width or height to be
     * set but testing indicates that this isn't true.
     */
    return addQueryParametersToURL(imgixURL, {
        dpr: adjustedRatio,
        auto: 'compress',
    });
};

/*
 * Do some fancy math to determine what width and height the header logo image should be displayed at
 * in order to achieve the desired square pixel area
 * We're using the following formula to derive these dimensions:
 * (A = area, r = image apsect ratio, w = target width, h = target height)
 * A = w * h
 * r = w / h
 * w^2 = A * r
 * h^2 = A / r
 *
 * @param {number}  logoAspectRatio   Aspect ratio of the logo image
 */
export const getHeaderLogoDisplayDimensionsForAspectRatio = (logoAspectRatio) => ({
    width: Math.round(Math.sqrt(HEADER_LOGO_DISPLAY_AREA * logoAspectRatio)),
    height: Math.round(Math.sqrt(HEADER_LOGO_DISPLAY_AREA / logoAspectRatio)),
});

/**
 * Map all keys in an object per a given iteratee.
 * Useful for converting key casing between API requests.
 *
 * @param {object} object Object containing (at least one) dictionary whose keys will be mapped per the provided iteratee
 * @param {func} iteratee Function to run with all keys in provided object
 * @param {dict} specialMappings Dictionary containing key value pairs for any special cases
 */
export const mapDictKeys = (object, iteratee, specialMappings) =>
    _.transform(object, (result, value, key) => {
        // Use the special mapping if provided, if not, convert the original key
        const mappedKey = specialMappings ? .[key] || iteratee(key);

        // If we are dealing with nested objects, call this method recursively with the current
        // value to ensure all keys are mapped correctly.
        // eslint-disable-next-line no-param-reassign
        result[mappedKey] = _.isObject(value) ? mapDictKeys(value, iteratee, specialMappings) : value;
    });