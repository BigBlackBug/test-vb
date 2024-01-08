// Vendor
import _ from 'lodash';

// Local
import {
    globalizeSelector
} from 'app/utils/selectors.js';
import {
    stateKeys
} from 'app/constants/State.js';

const localSelectors = {};
/**
 * Returns the collection for the provided collection slug.
 * @param  {Object} state
 * @param  {String} slug
 * @returns {Object} Collection
 */
localSelectors.getCollectionBySlug = (state, slug) => _.find(state.items, {
    slug
});

/**
 * Returns the error in the collections slice, likely from a failed collection fetch.
 * @param  {Object} state
 * @returns {Object} Error object
 */
localSelectors.getCollectionsError = (state) => state.error;

/**
 * Returns whether or not the collection with the provided slug is currently
 * being fetched from the server.
 * @param  {Object} state
 * @param  {String} slug
 * @returns {Boolean}
 */
localSelectors.isFetchingCollection = (state, slug) => _.includes(state.itemsBeingFetched, slug);

/**
 * Returns whether ANY collection is currently being fetched from the server.
 * @param  {Object} state
 * @return {Boolean}
 */
localSelectors.isFetchingAnyCollection = (state) => !!state.itemsBeingFetched.length;

/**
 * Returns a boolean for whether or not we should fetch the collection with
 * the provided slug (if we already have the collection loaded OR
 * we've already started fetching the collection, return false).
 * @param  {Object} state
 * @param  {String} slug
 */
localSelectors.shouldFetchCollection = (state, slug) =>
    !(
        localSelectors.getCollectionBySlug(state, slug) ||
        localSelectors.isFetchingCollection(state, slug)
    );

/**
 * Returns the collections loaded into the state.
 * @param  {Object} state
 */
localSelectors.getCollections = (state) => state.items;

/**
 * Returns the collection view for the provided collection view guid.
 * @param  {Object} state
 * @param  {String} guid
 * @returns {Object} Collection
 */
localSelectors.getCollectionViewByGUID = (state, guid) => _.find(state.views, {
    guid
});

/**
 * Returns the collection view for the given variant group slug
 * @param {object} state
 * @param {string} variantGroupSlug
 */
localSelectors.getCollectionViewForVariantGroup = (state, variantGroupSlug) => {
    const collection = localSelectors.getCollectionBySlug(state, variantGroupSlug);

    if (collection && collection.collection_view) {
        return localSelectors.getCollectionViewByGUID(state, collection.collection_view.guid);
    }

    return null;
};

/**
 * Returns a collection title for a variant group. collection.collection_view.gallery_title
 * is the default, but we fall back on collection.display_name as not every collection may
 * have a respective collection_view or gallery_title.
 * @param  {Object} state State
 * @param  {string} slug  Variant group slug
 * @return {string}       Collection title
 */
localSelectors.getCollectionTitleForVariantGroup = (state, slug) => {
    const collection = localSelectors.getCollectionBySlug(state, slug);

    if (!collection) {
        return null;
    }

    if (collection.collection_view && collection.collection_view.gallery_title) {
        return collection.collection_view.gallery_title;
    }

    return collection.display_name;
};

/**
 * Returns the number of variants in a variant group.
 */
localSelectors.getNumVariantsInVariantGroup = (state, slug) => {
    const collection = localSelectors.getCollectionBySlug(state, slug);

    if (!collection) {
        return 0;
    }

    return collection.videoTemplateVariants.length;
};

/**
 * Returns the variantGroup's Variants.
 *
 * @param   {Object} state
 * @param   {String} variantGroupSlug
 * @returns {Array}  VariantGroupVariantsSlugs
 */
localSelectors.getVariantGroupVariantsByVariantGroupSlug = (state, variantGroupSlug) => {
    const collection = localSelectors.getCollectionBySlug(state, variantGroupSlug);

    if (!collection) {
        return [];
    }

    return collection.videoTemplateVariants;
};

/**
 * Returns whether or not the collection view with the provided guid is currently
 * being fetched from the server.
 * @param  {Object} state
 * @param  {String} guid
 * @returns {Boolean}
 */
localSelectors.isFetchingCollectionView = (state, guid) =>
    _.includes(state.viewsBeingFetched, guid);

/**
 * Returns a list of variantGroups from a provided list of variantGroup slugs.
 * @param {Object} state
 * @param {Array}  variantGroupSlugs
 * @return {Array}
 */
localSelectors.getVariantGroupsBySlugs = (state, variantGroupSlugs) => {
    if (_.isEmpty(variantGroupSlugs)) {
        return [];
    }

    const variantGroups = variantGroupSlugs.map((collectionSlug) =>
        localSelectors.getCollectionBySlug(state, collectionSlug),
    );

    /* Filter out those gross falsy elements */
    return variantGroups.filter((variantGroup) => !!variantGroup);
};

export default localSelectors;

// Export global selectors.
const moduleName = 'collections';
const localPath = stateKeys[moduleName];

export const getCollectionBySlug = globalizeSelector(localSelectors.getCollectionBySlug, localPath);
export const getCollections = globalizeSelector(localSelectors.getCollections, localPath);
export const getCollectionsError = globalizeSelector(localSelectors.getCollectionsError, localPath);
export const getVariantGroupsBySlugs = globalizeSelector(
    localSelectors.getVariantGroupsBySlugs,
    localPath,
);
export const isFetchingAnyCollection = globalizeSelector(
    localSelectors.isFetchingAnyCollection,
    localPath,
);
export const isFetchingCollection = globalizeSelector(
    localSelectors.isFetchingCollection,
    localPath,
);
export const shouldFetchCollection = globalizeSelector(
    localSelectors.shouldFetchCollection,
    localPath,
);
export const getCollectionViewByGUID = globalizeSelector(
    localSelectors.getCollectionViewByGUID,
    localPath,
);
export const getCollectionViewForVariantGroup = globalizeSelector(
    localSelectors.getCollectionViewForVariantGroup,
    localPath,
);
export const getCollectionTitleForVariantGroup = globalizeSelector(
    localSelectors.getCollectionTitleForVariantGroup,
    localPath,
);
export const getNumVariantsInVariantGroup = globalizeSelector(
    localSelectors.getNumVariantsInVariantGroup,
    localPath,
);
export const getVariantGroupVariantsByVariantGroupSlug = globalizeSelector(
    localSelectors.getVariantGroupVariantsByVariantGroupSlug,
    localPath,
);
export const isFetchingCollectionView = globalizeSelector(
    localSelectors.isFetchingCollectionView,
    localPath,
);