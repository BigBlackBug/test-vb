// Vendor
import _ from 'lodash';

// Local
import baseAPI from 'shared/api/core/base.js';

/**
 * Fetch the collection with the provided slug.
 * @param  {String} collectionSlug Collection slug.
 */
export const fetchCollection = (collectionSlug) => {
    const url = `video-template-variant-collections/${collectionSlug}/`;
    return baseAPI.get(url);
};

/**
 * Fetch a list of collections with the provided slugs, or all of them
 * if no slugs are provided.
 * @param  {String} collectionSlugs List of Collection slugs.
 */
export const fetchCollections = (collectionSlugs) => {
    let url = `video-template-variant-collections/`;

    if (!_.isEmpty(collectionSlugs)) {
        // The API will be expecting lists of slugs as a comma-delimited parameter named `slug__in`.
        const slugs = collectionSlugs.join();
        url = `${url}?slug__in=${slugs}`;
    }

    const apiResponse = baseAPI.get(url);
    // FIXME: The Python API will (sometimes?!?) return a single object instead of an array of 1 object so
    //        we need to normalize the response here.
    return apiResponse.then((response) => (Array.isArray(response) ? response : [response]));
};

/**
 * Fetch the collection view with the provided guid.
 * @param  {String} collectionGUID Collection GUID.
 */
export const fetchCollectionView = (collectionGUID) => {
    const url = `collection-views/${collectionGUID}/`;
    return baseAPI.get(url);
};