// Vendor
import _ from 'lodash';

// Local
import {
    VideoSpec
} from 'app/objects.js';
import {
    globalizeSelector
} from 'app/utils/selectors.js';
import {
    stateKeys
} from 'app/constants/State.js';

const localSelectors = {};

/**
 * Returns the variant with the provided slug, if found.
 * @param  {Object} state
 * @param  {String} slug
 * @return {Object} Variant object
 */
localSelectors.getVariantBySlug = (state, slug) => _.find(state.items, {
    slug
});

/**
 * Returns the variant with the provided guid, if found
 * @param  {Object}  state
 * @param  {String}  guid
 * @return {Object}  Variant object
 */
localSelectors.getVariantByGUID = (state, guid) => _.find(state.items, {
    guid
});

/**
 * Returns the variant with the provided slug, if found. If a businessGUID is provided, this will check
 * the variant for the given business as well.
 *
 * @param  {Object} state
 * @param  {String} slug
 * @param  {String} [businessGUID]
 * @return {Object} Variant object
 */
localSelectors.getVariantBySlugAndBusiness = (state, variantSlug, businessGUID = null) =>
    _.find(state.items, {
        slug: variantSlug,
        selected_business: businessGUID
    });

/**
 * Returns the variant with the provided guid, if found. If a businessGUID is provided, this will check
 * the variant for the given business as well.
 *
 * @param {Object} state
 * @param {string} variantGUID
 * @param {string} businessGUID
 * @returns {Object}  Variant object
 */
localSelectors.getVariantByGUIDAndBusiness = (state, variantGUID, businessGUID = null) =>
    _.find(state.items, {
        guid: variantGUID,
        selected_business: businessGUID
    });

/**
 * Returns the list of variants whose slug is in the provided list of slugs.
 * @param  {Object} state
 * @param  {Array} slugs
 * @return {Array} List of variants
 */
localSelectors.getVariantsFromSlugs = (state, slugs) => {
    // This could be eliminated eventually (or moved), but right now we are at risk of somebody
    // variants being affected by reference. So, we'll clone the list.
    const variants = slugs.map((slug) => localSelectors.getVariantBySlug(state, slug));

    return _.cloneDeep(variants.filter((variant) => !!variant));
};

// NOTE: By default, our API returns variant lists in order so that the below "getOrderedVariantsFromSlugs"
// function is no longer useful (or used anywhere!)
/**
 * Returns the ordered list of variants whose slug is in the provided list of slugs.
 * Unlike getVariantsFromSlugs, this method preserves slug order.
 * @param  {Object} state
 * @param  {Array} slugs
 * @return {Array} List of variants
 */
localSelectors.getOrderedVariantsFromSlugs = (state, slugs) =>
    slugs.map((slug) => localSelectors.getVariantBySlug(state, slug));

/**
 * Returns the offer slug of the variant with the provided guid
 */
localSelectors.getVariantOfferSlugByGUID = (state, guid) => {
    const variant = localSelectors.getVariantByGUID(state, guid);
    return variant ? variant.offer : null;
};

/**
 * Returns whether the variant with the provided slug is currently being fetched.
 * @param  {Object} state
 * @param  {String} slug
 * @return {Boolean}
 */
localSelectors.isFetchingVariant = (state, slug) => _.includes(state.itemsBeingFetched, slug);

/**
 * Returns whether any variant is currently being fetched.
 * @param  {Object} state
 * @return {Boolean}
 */
localSelectors.isFetchingAnyVariant = (state) => !!state.itemsBeingFetched.length;

/**
 * Returns a boolean for whether or not we should fetch the Variant with
 * the provided guid (if we already have the Variant loaded OR
 * we've already started fetching the Variant, return false).
 * @param  {Object} state
 * @param  {String} slug
 * @return {Boolean} False if we already have the variant or are currently loading it, true otherwise.
 */
localSelectors.shouldFetchVariant = (state, slug) =>
    !(localSelectors.getVariantBySlug(state, slug) || localSelectors.isFetchingVariant(state, slug));

/**
 * From the list of provided variant slugs, determines which variants
 * have not yet been fetched from the server and loaded into the store state.
 * @param  {Object} state           Current store state
 * @param  {Array} variantSlugs     Compound variant slugs
 * @return {Array}  Array of variant slugs that need to be fetched from the server.
 */
localSelectors.excludeLoadedVariants = (state, variantSlugs) => {
    if (!variantSlugs) {
        return [];
    }
    return variantSlugs.filter(
        (slug) =>
        !(
            localSelectors.getVariantBySlug(state, slug) ||
            localSelectors.isFetchingVariant(state, slug)
        ),
    );
};

/**
 * Returns the variant-related error, likely from variant fetching.
 * @param  {Object} state
 * @return {String}
 */
localSelectors.getVariantsError = (state) => state.error;

/**
 * Returns the variants loaded into the state.
 * @param  {Object} state
 * @return {Array} Variant objects
 */
localSelectors.getVariants = (state) => state.items;

/**
 * Returns the variants loaded into the state for the provided selectedBusinessGUID.
 * @param  {Object} state
 * @return {Array} Variant objects
 */
localSelectors.getVariantsForBusiness = (state, businessGUID) =>
    localSelectors.getVariants(state).filter((variant) => variant.selected_business === businessGUID);

/**
 * Returns audio options stored on the variant.
 * @param  {Object}   state
 * @param  {string}   slug  Variant slug.
 * @return {Array}    Audio options
 */
localSelectors.getVariantAudioOverrides = (state, slug) => {
    const variant = localSelectors.getVariantBySlug(state, slug);

    if (!variant) return null;

    return variant.video_template_variant_audio || [];
};

/**
 * Returns global audio options stored on the variant.
 * @param  {Object}   state
 * @param  {string}   slug  Variant slug.
 * @return {Array}    Audio options
 */
localSelectors.getGlobalAudioOptions = (state, slug) => {
    const variant = localSelectors.getVariantBySlug(state, slug);

    if (!variant) return null;

    return variant.global_video_template_audio || [];
};

export default localSelectors;

// Export global selectors.
const moduleName = 'variants';
const localPath = stateKeys[moduleName];

export const excludeLoadedVariants = globalizeSelector(
    localSelectors.excludeLoadedVariants,
    localPath,
);
export const getOrderedVariantsFromSlugs = globalizeSelector(
    localSelectors.getOrderedVariantsFromSlugs,
    localPath,
);
export const getVariantOfferSlugByGUID = globalizeSelector(
    localSelectors.getVariantOfferSlugByGUID,
    localPath,
);
export const getVariantBySlug = globalizeSelector(localSelectors.getVariantBySlug, localPath);
export const getVariantByGUID = globalizeSelector(localSelectors.getVariantByGUID, localPath);
export const getVariantBySlugAndBusiness = globalizeSelector(
    localSelectors.getVariantBySlugAndBusiness,
    localPath,
);
export const getVariantByGUIDAndBusiness = globalizeSelector(
    localSelectors.getVariantByGUIDAndBusiness,
    localPath,
);
export const getVariantsFromSlugs = globalizeSelector(
    localSelectors.getVariantsFromSlugs,
    localPath,
);
export const getVariants = globalizeSelector(localSelectors.getVariants, localPath);
export const getVariantsForBusiness = globalizeSelector(
    localSelectors.getVariantsForBusiness,
    localPath,
);
export const getVariantsError = globalizeSelector(localSelectors.getVariantsError, localPath);
export const isFetchingAnyVariant = globalizeSelector(
    localSelectors.isFetchingAnyVariant,
    localPath,
);
export const isFetchingVariant = globalizeSelector(localSelectors.isFetchingVariant, localPath);
export const shouldFetchVariant = globalizeSelector(localSelectors.shouldFetchVariant, localPath);
export const getVariantAudioOverrides = globalizeSelector(
    localSelectors.getVariantAudioOverrides,
    localPath,
);
export const getGlobalAudioOptions = globalizeSelector(
    localSelectors.getGlobalAudioOptions,
    localPath,
);